#!/usr/bin/env node
/**
 * Captures the customer dashboard for /products/vigil, in both themes.
 * Opens a visible Chrome on the local login page; you sign in (the script
 * never sees the password), it waits until you land in /dashboard, then
 * captures each page at 1280×800 and writes
 * public/site/dashboard/<page>-<theme>.webp.
 *
 *   npm run dev
 *   node scripts/capture-dashboard.mjs
 *
 * Nothing but the DevTools protocol; no npm dependencies.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { tmpdir } from "node:os";

const CHROME = process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const BASE = process.env.BASE_URL ?? "http://127.0.0.1:3000";
const PORT = 9334;
const WIDTH = 1280;
const HEIGHT = 800;
const SCALE = 0.75; // → 960×600 files
const PAGES = [
  { key: "overview", path: "/dashboard" },
  { key: "website", path: "/dashboard/website" },
  { key: "domain", path: "/dashboard/domain" },
  { key: "requests", path: "/dashboard/requests" },
  { key: "billing", path: "/dashboard/billing" },
];
const THEMES = ["dark", "light"];
const OUT_DIR = path.resolve("public/site/dashboard");

/**
 * Marketing tidy-up, DOM only: no dev badge, no staff-only chrome (the
 * "Staff view" label and the Admin cross-link), and the signed-in account
 * shown as the demo tenant's owner rather than a real address.
 */
const TIDY = `
  document.querySelector("nextjs-portal")?.remove();
  for (const el of document.querySelectorAll("aside div")) if (el.textContent.trim() === "Staff view") el.remove();
  document.querySelector('aside a[title="Admin"]')?.remove();
  const aside = document.querySelector("aside");
  if (aside) {
    const walker = document.createTreeWalker(aside, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const n of nodes) if (n.nodeValue.includes("@")) n.nodeValue = "Owner, Marlow & Fen";
    const avatar = [...aside.querySelectorAll("span.rounded-full")].find((el) => el.textContent.trim().length === 1);
    if (avatar) avatar.textContent = "M";
  }
`;

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  // A fixed profile keeps the session between runs, so a re-capture needs no new sign-in.
  const profile = process.env.PROFILE_DIR ?? path.join(tmpdir(), "vigil-dash-profile");
  await mkdir(profile, { recursive: true });
  const chrome = spawn(CHROME, [`--remote-debugging-port=${PORT}`, `--user-data-dir=${profile}`, `--window-size=${WIDTH + 16},${HEIGHT + 120}`, "--no-first-run", "--no-default-browser-check", `${BASE}/login?next=/dashboard`], { stdio: "ignore" });
  try {
    const cdp = await connect(await waitForTarget());
    await cdp.send("Page.enable");
    await cdp.send("Runtime.enable");
    console.log("Sign in in the Chrome window that just opened. Waiting for /dashboard…");
    await waitFor(async () => (await cdp.evaluate("location.pathname")).startsWith("/dashboard"), 10 * 60 * 1000);
    console.log("Signed in. Capturing…");
    await cdp.send("Emulation.setDeviceMetricsOverride", { width: WIDTH, height: HEIGHT, deviceScaleFactor: 1, mobile: false });
    const originalTheme = await cdp.evaluate("document.documentElement.dataset.theme || 'dark'");
    for (const theme of THEMES) {
      for (const page of PAGES) {
        const loaded = cdp.once("Page.loadEventFired");
        await cdp.send("Page.navigate", { url: `${BASE}${page.path}` });
        await loaded;
        await cdp.evaluate(`(async () => {
          document.documentElement.dataset.theme = ${JSON.stringify(theme)};
          await document.fonts.ready;
          window.scrollTo(0, 0);
          await new Promise(r => setTimeout(r, 1800));
          ${TIDY}
        })()`);
        const { data } = await cdp.send("Page.captureScreenshot", { format: "webp", quality: 84, clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT, scale: SCALE } });
        const file = `${page.key}-${theme}.webp`;
        await writeFile(path.join(OUT_DIR, file), Buffer.from(data, "base64"));
        console.log(file);
      }
    }
    await cdp.evaluate(`document.documentElement.dataset.theme = ${JSON.stringify(originalTheme)}`);
    console.log("Done. You can close Chrome.");
    cdp.close();
  } finally {
    chrome.kill();
  }
}

async function waitFor(check, timeoutMs) {
  const start = Date.now();
  let failures = 0;
  while (Date.now() - start < timeoutMs) {
    try {
      if (await check()) return;
      failures = 0;
    } catch {
      // The tab was closed (or navigated somewhere the session cannot see).
      if (++failures > 6) throw new Error("Lost the Chrome tab. Keep the window the script opened open until it says Done.");
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error("Timed out waiting for sign-in");
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
        if (msg.error) rej(new Error(msg.error.message));
        else res(msg.result);
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
