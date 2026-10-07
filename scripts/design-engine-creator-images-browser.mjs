// Run after the existing Navigation/Hero QA bundle is served locally and the creator public folder is copied beside it.
import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "/tmp/vigil-professional-tools/node_modules/playwright");
const url = process.env.CREATOR_QA_URL || "http://127.0.0.1:4196";
const output = "docs/design-engine/creator-image-package/evidence";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const page = await browser.newPage({ viewport: { width: 1720, height: 1100 } });
const errors = [], checks = [];
page.on("pageerror", error => errors.push(error.message));
page.on("response", response => { if (response.status() >= 400 && response.url().includes("design-engine-creators")) errors.push(`${response.status()} ${response.url()}`); });
const packs = ["creator-pink-light", "creator-pink-dark", "creator-neutral-light", "creator-neutral-dark"];
async function apply(root, value) {
  const control = root.locator('[data-choice-label="Client adaptation"]');
  await control.locator(".lab-choice-trigger").click();
  await control.locator(`button[data-choice-value="${value}"]`).click();
}
async function loaded(root) {
  const result = await root.locator("img").evaluateAll(async all => {
    const images = all.filter(image => image.src.includes("design-engine-creators"));
    await Promise.all(images.map(image => image.decode().catch(() => {})));
    return { count: images.length, failed: images.filter(image => image.naturalWidth === 0).map(image => image.src) };
  });
  if (!result.count || result.failed.length) throw Error(JSON.stringify(result));
  return result.count;
}
try {
  await page.goto(`${url}/?lab`);
  const design = page.locator(".professional-lab");
  const selected = design.getByLabel(/Selected component/);
  await selected.waitFor();
  for (const id of ["hero.full-scene", "hero.comparison", "hero.object-study", "work.viewport-gallery", "work.media-cabinet", "commerce.inspection-desk", "primitive.media"]) {
    await selected.selectOption(id);
    for (const pack of packs) {
      await apply(design, pack);
      if (await design.locator(".composition-blocked").count()) throw Error(`Blocked ${id}/${pack}`);
      checks.push({ case: "design-apply", id, pack, images: await loaded(design.locator("[data-lab-canvas]:not([hidden]) .de-root").first()) });
    }
  }
  await selected.selectOption("hero.full-scene");
  await apply(design, "creator-neutral-light");
  const control = design.locator('[data-choice-label="Client adaptation"]');
  const canvas = design.locator("[data-lab-canvas]:not([hidden]) .de-root").first();
  const before = await canvas.innerHTML();
  await control.locator(".lab-choice-trigger").click();
  const pink = control.locator('button[data-choice-value="creator-pink-dark"]');
  await pink.hover();
  await page.waitForTimeout(100);
  if (!(await canvas.innerHTML()).includes("pink-dark-hero")) throw Error("Hover did not audition creator image");
  await page.keyboard.press("Escape");
  await page.waitForTimeout(100);
  if (await canvas.innerHTML() !== before) throw Error("Escape did not restore authored image");
  checks.push({ case: "hover-rollback" });
  await control.locator(".lab-choice-trigger").click();
  await control.locator('button[data-choice-value="creator-neutral-dark"]').focus();
  await page.waitForTimeout(100);
  if (!(await canvas.innerHTML()).includes("neutral-dark-hero")) throw Error("Focus did not audition image");
  await page.keyboard.press("Enter");
  await loaded(canvas);
  checks.push({ case: "keyboard-apply" });
  await page.screenshot({ path: `${output}/design-creator-dark.png` });
  await page.locator(".lab-workspace-switch:visible").getByRole("button", { name: "Composition", exact: true }).click();
  const lab = page.locator(".composition-lab");
  await lab.locator(".composition-preset-picker summary").click();
  await lab.getByLabel("Heroes demo", { exact: true }).selectOption("composition-a");
  await lab.getByRole("tab", { name: "Section", exact: true }).click();
  await lab.getByLabel("Selected section", { exact: true }).selectOption("opening");
  for (const pack of packs) {
    await apply(lab, pack);
    checks.push({ case: "composition-apply", pack, images: await loaded(lab.locator(".de-composition").first()) });
    const json = await lab.locator("pre").last().innerText();
    if (!json.includes(pack.replace("creator-", "") + "-hero")) throw Error("Creator photo was not persisted in Site JSON");
  }
  await page.screenshot({ path: `${output}/composition-creator-dark.png` });
  await page.goto(`${url}/design-engine-creators/index.html`);
  await page.setViewportSize({ width: 1440, height: 1800 });
  if (await loaded(page) !== 16) throw Error("Incomplete visual index");
  await page.screenshot({ path: `${output}/contact-sheet.png`, fullPage: true });
  for (const width of [768, 390]) {
    await page.setViewportSize({ width, height: 1000 });
    if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error("Visual index overflows");
    await loaded(page);
    checks.push({ case: "responsive-index", width });
  }
  if (errors.length) throw Error(errors.join("\n"));
  await writeFile(`${output}/browser-results.json`, JSON.stringify({ checks, errors }, null, 2));
  console.log(`${checks.length} creator browser checks passed.`);
} finally { await browser.close(); }
