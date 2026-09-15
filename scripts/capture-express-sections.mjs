#!/usr/bin/env node
/**
 * Captures a 4:3 crop of every substantial section of each available
 * Express template, for the marquee behind the home page's "Start where you
 * are" section. Talks to a local Chrome over the DevTools protocol, so it
 * needs no npm dependencies.
 *
 *   npm run dev                       # serves public/express-templates/*.html
 *   node scripts/capture-express-sections.mjs
 *
 * Output: public/express-templates/sections/<slug>-<n>.webp and an index at
 * lib/express-section-shots.json (read by the marquee).
 */
import { mkdir, writeFile, readdir, unlink } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { tmpdir } from "node:os";

const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const PORT = 9333;
const WIDTH = 1280;
const CLIP_H = 960; // 4:3 at 1280 wide
const SCALE = 0.6; // → 768×576 files
const MIN_SECTION_H = 480;
const SLUGS = ["restaurant", "retail", "salon-spa", "auto-services"];
const OUT_DIR = path.resolve("public/express-templates/sections");

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  for (const f of await readdir(OUT_DIR)) if (f.endsWith(".webp")) await unlink(path.join(OUT_DIR, f));

  const profile = await import("node:fs/promises").then((fs) => fs.mkdtemp(path.join(tmpdir(), "vigil-shots-")));
  const chrome = spawn(CHROME, ["--headless=new", `--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, `--window-size=${WIDTH},800`, "--hide-scrollbars", "--no-first-run", "--disable-gpu", "about:blank"], { stdio: "ignore" });
  try {
    const wsUrl = await waitForTarget();
    const cdp = await connect(wsUrl);
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: WIDTH, height: 800, deviceScaleFactor: 1, mobile: false });
    await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });

    const index = [];
    for (const slug of SLUGS) {
      const loaded = cdp.once("Page.loadEventFired");
      await cdp.send("Page.navigate", { url: `${BASE}/express-templates/${slug}.html` });
      await loaded;
      // Fonts, then a slow pass down the page so scroll-triggered reveals fire, then back to the top.
      await cdp.evaluate(`(async () => {
        await document.fonts.ready;
        const h = document.documentElement.scrollHeight;
        for (let y = 0; y < h; y += 400) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); }
        window.scrollTo(0, 0);
        await new Promise(r => setTimeout(r, 800));
      })()`);
      const sections = await cdp.evaluate(`(() => {
        const H = document.documentElement.scrollHeight;
        return [...document.querySelectorAll("section")].map(s => {
          const r = s.getBoundingClientRect();
          return { top: Math.round(r.top + window.scrollY), height: Math.round(r.height), id: s.id || s.className.split(" ")[0] || "section" };
        }).filter(s => s.height >= ${MIN_SECTION_H} && s.top + 200 < H);
      })()`);
      const pageHeight = await cdp.evaluate("document.documentElement.scrollHeight");
      let n = 0;
      for (const s of sections) {
        const y = Math.min(s.top, Math.max(0, pageHeight - CLIP_H));
        const { data } = await cdp.send("Page.captureScreenshot", { format: "webp", quality: 82, captureBeyondViewport: true, clip: { x: 0, y, width: WIDTH, height: CLIP_H, scale: SCALE } });
        n += 1;
        const file = `${slug}-${n}.webp`;
        await writeFile(path.join(OUT_DIR, file), Buffer.from(data, "base64"));
        index.push({ src: `/express-templates/sections/${file}`, slug, section: s.id });
        console.log(`${file}  (${s.id} @ ${y})`);
      }
    }
    await writeFile(path.resolve("lib/express-section-shots.json"), JSON.stringify(index, null, 2) + "\n");
    console.log(`${index.length} shots`);
    cdp.close();
  } finally {
    chrome.kill();
  }
}

async function waitForTarget() {
  for (let i = 0; i < 50; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json`);
      const targets = await res.json();
      const page = targets.find((t) => t.type === "page");
      if (page) return page.webSocketDebuggerUrl;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("Chrome did not expose a page target");
}

function connect(url) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    let id = 0;
    const pending = new Map();
    const waiters = new Map();
    ws.onopen = () =>
      resolve({
        send(method, params = {}) {
          const msgId = ++id;
          ws.send(JSON.stringify({ id: msgId, method, params }));
          return new Promise((res, rej) => pending.set(msgId, { res, rej }));
        },
        once(event) {
          return new Promise((res) => waiters.set(event, res));
        },
        async evaluate(expression) {
          const { result, exceptionDetails } = await this.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
          if (exceptionDetails) throw new Error(exceptionDetails.text + " " + JSON.stringify(exceptionDetails.exception));
          return result.value;
        },
        close: () => ws.close(),
      });
    ws.onerror = (e) => reject(e);
    ws.onmessage = (m) => {
      const msg = JSON.parse(m.data);
      if (msg.id && pending.has(msg.id)) {
        const { res, rej } = pending.get(msg.id);
        pending.delete(msg.id);
        msg.error ? rej(new Error(msg.error.message)) : res(msg.result);
      } else if (msg.method && waiters.has(msg.method)) {
        waiters.get(msg.method)(msg.params);
        waiters.delete(msg.method);
      }
    };
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
