import { createRequire } from "node:module";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const baseURL = process.env.BASE_URL || "http://localhost:3101";
const output = path.resolve(
  process.env.EVIDENCE_DIR || "docs/performance/2026-10-13/evidence/browser",
);
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: "chrome", headless: true });
// Optional private preview authentication; never include cookies in evidence.
const cookies = process.env.AUTH_COOKIES_FILE
  ? JSON.parse(await readFile(process.env.AUTH_COOKIES_FILE, "utf8"))
  : [];
const report = [];
try {
  // Hold the framework chunks: both opening effects must run from initial HTML,
  // then transfer ownership without changing their clock or logging hydration errors.
  const bootstrapPage = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
  });
  await bootstrapPage.context().addCookies(cookies);
  const bootstrapErrors = [];
  bootstrapPage.on("console", (message) => {
    if (/hydrat|Minified React error #418/i.test(message.text()))
      bootstrapErrors.push(message.text());
  });
  let releaseChunks;
  const chunksReady = new Promise((resolve) => {
    releaseChunks = resolve;
  });
  await bootstrapPage.route(
    /\/_next\/static\/chunks\/.*\.js/,
    async (route) => {
      await chunksReady;
      await route.continue();
    },
  );
  await bootstrapPage.goto(baseURL, { waitUntil: "domcontentloaded" });
  await bootstrapPage.waitForTimeout(1000);
  const early = await bootstrapPage.evaluate(() => ({
    title: document.querySelector("#hero-title .story-text").textContent,
    owner: document.querySelector("#hero-title").dataset.typeOwner,
    typeStart: document.querySelector("#hero-title").dataset.typeStart,
    wireOwner: document.querySelector("#hero-wire").dataset.wireOwner,
    wireStart: document.querySelector("#hero-wire").dataset.wireStart,
  }));
  assert.equal(early.owner, "bootstrap");
  assert.equal(early.wireOwner, "bootstrap");
  assert(
    early.title.length > 0,
    "Typewriter paints before the framework bundle",
  );
  const nativePixels = await bootstrapPage.evaluate(() => {
    const c = document.querySelector("#hero-wire");
    const d = c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
    return d.some((n, i) => i % 4 === 3 && n > 0);
  });
  assert(nativePixels, "Wireframe paints before the framework bundle");
  releaseChunks();
  await bootstrapPage.waitForFunction(
    () =>
      document.querySelector("#hero-title")?.dataset.typeOwner === "react" &&
      document.querySelector("#hero-wire")?.dataset.wireOwner === "react",
  );
  const adopted = await bootstrapPage.evaluate(() => ({
    typeStart: document.querySelector("#hero-title").dataset.typeStart,
    wireStart: document.querySelector("#hero-wire").dataset.wireStart,
  }));
  assert.equal(adopted.typeStart, early.typeStart);
  assert.equal(adopted.wireStart, early.wireStart);
  assert.deepEqual(
    bootstrapErrors,
    [],
    "Native startup preserves the hydration structure",
  );
  await bootstrapPage.keyboard.press("Tab");
  await bootstrapPage.waitForTimeout(500);
  const focusTarget = bootstrapPage.locator("#start .snap-center a").first();
  const focusHref = await focusTarget.getAttribute("href");
  await focusTarget.focus();
  await bootstrapPage.waitForTimeout(1000);
  assert.equal(
    await bootstrapPage.evaluate(() =>
      document.activeElement?.getAttribute("href"),
    ),
    focusHref,
    "Keyboard focus survives viewport runtime initialization",
  );
  report.push({
    name: "native-startup",
    early,
    adopted,
    errors: bootstrapErrors,
    focusPreserved: focusHref,
  });
  await bootstrapPage.close();
  for (const [name, width, height, touch, reduced] of [
    ["desktop", 1440, 900, false, false],
    ["phone", 390, 844, true, false],
    ["reduced-motion", 1440, 900, false, true],
  ]) {
    const page = await browser.newPage({
      viewport: { width, height },
      isMobile: touch,
      hasTouch: touch,
      deviceScaleFactor: 2,
    });
    await page.context().addCookies(cookies);
    const errors = [],
      hydrationErrors = [];
    page.on("pageerror", (error) => errors.push(String(error)));
    page.on("console", (message) => {
      if (/hydrat|Minified React error #418/i.test(message.text()))
        hydrationErrors.push(message.text());
    });
    await page.emulateMedia({
      reducedMotion: reduced ? "reduce" : "no-preference",
    });
    await page.addInitScript(() => {
      window.__contexts = [];
      const original = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (...args) {
        window.__contexts.push(args[0]);
        return original.apply(this, args);
      };
      for (const Type of [
        window.WebGLRenderingContext,
        window.WebGL2RenderingContext,
      ]) {
        if (!Type) continue;
        for (const method of ["drawArrays", "drawElements"]) {
          const originalDraw = Type.prototype[method];
          Type.prototype[method] = function (...args) {
            this.canvas.__draws = (this.canvas.__draws || 0) + 1;
            return originalDraw.apply(this, args);
          };
        }
      }
    });
    await page.goto(baseURL, { waitUntil: "networkidle" });
    await page.waitForFunction(
      () =>
        document.querySelector("h1")?.firstChild?.textContent ===
        "Keeping watch over your business online.",
    );
    await page.waitForFunction(
      () =>
        Number(
          getComputedStyle(document.querySelector("#hero-actions")).opacity,
        ) > 0.99,
    );
    const startup = await page.evaluate(() => ({
      contexts: window.__contexts,
      scriptBytes: performance
        .getEntriesByType("resource")
        .filter((r) => r.initiatorType === "script")
        .reduce((sum, r) => sum + r.transferSize, 0),
      title: document.querySelector("h1").textContent,
    }));
    assert(
      !startup.contexts.some((type) => type.startsWith("webgl")),
      "No invisible WebGL context should initialize at the hero",
    );
    const wirePixels = () =>
      page.evaluate(() => {
        const canvas = document.querySelector(".hero-layer canvas");
        const data = canvas
          .getContext("2d")
          .getImageData(0, 0, canvas.width, canvas.height).data;
        let sum = 0;
        for (let i = 3; i < data.length; i += 4) sum += data[i];
        return sum;
      });
    const firstPixels = await wirePixels();
    assert(firstPixels > 0, "Wireframe must render");
    await page.waitForTimeout(200);
    const nextPixels = await wirePixels();
    if (reduced)
      assert.equal(
        firstPixels,
        nextPixels,
        "Reduced-motion wireframe stays still",
      );
    else assert.notEqual(firstPixels, nextPixels, "Wireframe keeps rotating");
    await page.screenshot({ path: path.join(output, `${name}-hero.png`) });
    // The first interaction must load transitions and retain the requested state.
    if (touch) {
      await page.getByRole("button", { name: "Open menu" }).click();
      await page.waitForSelector('nav a[href="/pricing"]:visible');
      await page.getByRole("button", { name: "Close menu" }).click();
      await page.waitForSelector('nav a[href="/pricing"]:visible', {
        state: "detached",
      });
    } else {
      await page.getByRole("button", { name: "Products menu" }).focus();
      await page.keyboard.press("Enter");
      await page.waitForSelector('[role="menu"]');
      await page.keyboard.press("Escape");
      await page.waitForSelector('[role="menu"]', { state: "detached" });
    }
    const scroll = async (p) => {
      await page.evaluate((p) => {
        const main = document.getElementById("site-root");
        main.style.scrollBehavior = "auto";
        main.scrollTop =
          (document.querySelector(".story").offsetHeight - 3 * innerHeight) * p;
      }, p);
      await page.waitForTimeout(500);
    };
    await scroll(0.2);
    await page.screenshot({ path: path.join(output, `${name}-breakup.png`) });
    await scroll(0.32);
    assert.equal(await wirePixels(), 0, "Wireframe clears after the breakup");
    await scroll(0.63);
    await page.waitForSelector(".hiw-orb canvas");
    await page.waitForFunction(
      () => (document.querySelector(".hiw-orb canvas")?.__draws || 0) > 0,
    );
    await page.waitForTimeout(900);
    await page.screenshot({ path: path.join(output, `${name}-step2.png`) });
    await scroll(1);
    assert.equal(
      await page.locator(".hiw-orb canvas").count(),
      0,
      "Story orb unmounts after its scene",
    );
    await page.screenshot({ path: path.join(output, `${name}-finale.png`) });
    await page
      .locator("#start")
      .evaluate((el) => el.scrollIntoView({ behavior: "instant" }));
    await page.waitForTimeout(1000);
    await page
      .locator('[aria-label="Virtue, your website guide"]')
      .evaluate((el) => el.scrollIntoView({ behavior: "instant" }));
    await page.waitForSelector(
      '[aria-label="Virtue, your website guide"] canvas',
    );
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(output, `${name}-packages.png`) });
    const cardCount = await page.locator("#start .snap-center").count();
    assert.equal(cardCount, 3, "All three catalog build cards must be present");
    if (!touch) {
      const card = page.locator("#start .snap-center").first();
      await card.scrollIntoViewIfNeeded();
      await page.waitForTimeout(700);
      await card.hover();
      await page.waitForTimeout(500);
      const lift = await card.evaluate(
        (el) => new DOMMatrix(getComputedStyle(el).transform).m42,
      );
      assert(
        lift < -5 && lift > -7,
        "Card retains the six-pixel spring hover lift",
      );
      await page.mouse.move(5, 5);
    }
    await scroll(0);
    await page.waitForTimeout(500);
    const drawsBefore = await page.evaluate(
      () =>
        document.querySelector(
          '[aria-label="Virtue, your website guide"] canvas',
        ).__draws || 0,
    );
    await page.waitForTimeout(300);
    const drawsAfter = await page.evaluate(
      () =>
        document.querySelector(
          '[aria-label="Virtue, your website guide"] canvas',
        ).__draws || 0,
    );
    assert.equal(
      drawsBefore,
      drawsAfter,
      "Offscreen guide orb must stop drawing",
    );
    await page
      .getByRole("button", { name: "Book a call", exact: true })
      .first()
      .click();
    await page.waitForSelector('iframe[src*="calendly.com"]');
    assert(
      (
        await page.locator('iframe[src*="calendly.com"]').getAttribute("src")
      ).includes("website-strategy-call"),
    );
    await page.getByRole("button", { name: "Close booking popup" }).click();
    await page.waitForSelector('iframe[src*="calendly.com"]', {
      state: "detached",
    });
    if (touch) {
      await page.getByRole("button", { name: "Open menu" }).click();
      await page.waitForSelector('nav a[href="/pricing"]:visible');
      await page.getByRole("button", { name: "Close menu" }).click();
    } else {
      await page.getByRole("link", { name: "Products", exact: true }).hover();
      await page.waitForSelector('[role="menu"]');
      await page.keyboard.press("Escape");
      await page.waitForSelector('[role="menu"]', { state: "detached" });
    }
    const faq = page.locator("#faq button").nth(1);
    await faq.scrollIntoViewIfNeeded();
    await faq.click();
    assert.equal(await faq.getAttribute("aria-expanded"), "true");
    await faq.click();
    assert.equal(await faq.getAttribute("aria-expanded"), "false");
    await page
      .locator("#get-started")
      .evaluate((el) => el.scrollIntoView({ behavior: "instant" }));
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(output, `${name}-closing.png`) });
    assert.deepEqual(errors, [], "No browser exceptions");
    assert.deepEqual(
      hydrationErrors,
      [],
      "No hydration errors across native-to-React ownership",
    );
    report.push({
      name,
      startup,
      cardCount,
      offscreenDraws: { before: drawsBefore, after: drawsAfter },
      errors,
      hydrationErrors,
      checks:
        "wireframe rotation/reduced motion, breakup, story orb, offscreen pause, booking open/close, navigation, FAQ",
    });
    await page.close();
  }
  await writeFile(
    path.join(output, "checks.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report, null, 2));
} finally {
  await browser.close();
}
