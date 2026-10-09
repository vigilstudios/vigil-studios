import { createRequire } from "node:module";
import { mkdir, writeFile } from "node:fs/promises";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "/tmp/vigil-professional-tools/node_modules/playwright");
const url = process.env.CREATOR_QA_URL || "http://127.0.0.1:4216";
const output = "docs/design-engine/creator-sections/evidence";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", headless: true });
const page = await browser.newPage();
const errors = [], checks = [];
page.on("pageerror", error => errors.push(error.message));
page.on("response", response => { if (response.status() >= 400 && response.url().includes("design-engine-creators")) errors.push(`${response.status()} ${response.url()}`); });
async function loaded() {
  await page.locator(".de-root").first().waitFor();
  const result = await page.locator(".de-composition img").evaluateAll(async images => {
    images.forEach(image => { image.loading = "eager"; });
    await Promise.all(images.map(image => image.decode().catch(() => {})));
    return images.filter(image => !image.naturalWidth).map(image => image.src);
  });
  if (result.length) throw Error(`Images failed: ${result.join(", ")}`);
  if (await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)) throw Error(`Viewport overflow: ${page.url()}`);
}
async function choice(root, label, value) {
  const control = root.locator(`[data-choice-label="${label}"]`);
  await control.locator(".lab-choice-trigger").click();
  await control.locator(`button[data-choice-value="${value}"]`).click();
}
try {
  const packs = ["creator-pink-light", "creator-pink-dark", "creator-neutral-light", "creator-neutral-dark"];
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1100 });
    for (const pack of packs) {
      for (const [component, layouts] of [["about.creator-profile", ["scrapbook", "split", "centered"]], ["proof.social-reach", ["cards", "editorial", "compact"]], ["work.image-expansion", ["tabbed-cards"]]]) {
        for (const structure of layouts) {
          await page.goto(`${url}/?${new URLSearchParams({ component, pack, structure })}`);
          await loaded();
          if (component === "work.image-expansion") {
            const style = await page.locator(".vm-expansion-shell").evaluate(node => ({ background: getComputedStyle(node).backgroundColor, shadow: getComputedStyle(node).boxShadow, border: getComputedStyle(node).borderWidth, color: getComputedStyle(node).color, parentColor: getComputedStyle(node.parentElement).color }));
            if (style.background !== "rgba(0, 0, 0, 0)" || style.shadow !== "none" || style.border !== "0px" || style.color !== style.parentColor) throw Error(`Slider surface mismatch: ${JSON.stringify(style)}`);
          }
          checks.push({ case: "responsive-layout", component, structure, pack, width });
          if ((width === 1440 || width === 390) && pack === "creator-pink-light" && ["scrapbook", "cards", "tabbed-cards"].includes(structure)) await page.screenshot({ path: `${output}/${component.replace(".", "-")}-${width}.png`, fullPage: true });
        }
      }
    }
    for (const component of ["about.creator-profile", "proof.social-reach"]) {
      await page.goto(`${url}/?component=${component}&stress`);
      await loaded();
      checks.push({ case: "long-content", component, width });
    }
  }
  for (const pack of packs) for (const component of ["about.creator-profile", "proof.social-reach"]) {
    await page.goto(`${url}/?${new URLSearchParams({ component, pack })}`);
    await loaded();
    await page.addScriptTag({ path: process.env.AXE_SCRIPT || "/tmp/vigil-design-engine-qa/axe.min.js" });
    const issues = await page.evaluate(async () => (await window.axe.run(".de-composition", { runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21aa"] } })).violations.map(issue => ({ id: issue.id, nodes: issue.nodes.map(node => node.target) })));
    if (issues.length) throw Error(`Accessibility: ${component}/${pack}: ${JSON.stringify(issues)}`);
    checks.push({ case: "accessibility", component, pack });
  }
  await page.setViewportSize({ width: 1720, height: 1100 });
  await page.goto(`${url}/?lab`);
  const design = page.locator(".professional-lab");
  const selected = design.getByLabel(/Selected component/);
  await selected.waitFor();
  for (const id of ["proof.social-reach", "about.creator-profile", "story.open-letter", "services.delivery-journey", "proof.progress-trail", "contact.inquiry", "footer.compact"]) {
    await selected.selectOption(id);
    for (const pack of packs) {
      await choice(design, "Client adaptation", pack);
      if (await design.locator(".composition-blocked:visible").count()) throw Error(`Blocked ${id}/${pack}`);
      checks.push({ case: "editor-client", id, pack });
    }
  }
  await page.locator(".lab-workspace-switch:visible").getByRole("button", { name: "Composition", exact: true }).click();
  const lab = page.locator(".composition-lab");
  await lab.getByRole("tab", { name: "Layout", exact: true }).click();
  await lab.getByLabel("Section type", { exact: true }).selectOption("proof");
  await lab.getByRole("button", { name: "Social Reach", exact: true }).click();
  await lab.getByLabel("Metric 1 value", { exact: true }).fill("420K");
  await lab.getByLabel("Metric 1 value", { exact: true }).blur();
  await lab.getByLabel("Profile 1 URL", { exact: true }).fill("https://www.instagram.com/mycreator/");
  await lab.getByLabel("Profile 1 URL", { exact: true }).blur();
  await lab.getByRole("button", { name: "Add metric", exact: true }).click();
  await lab.getByRole("button", { name: "Add social profile", exact: true }).click();
  if (!(await lab.locator(".de-composition").innerText()).includes("420K")) throw Error("Metric edit missing from preview");
  if (await lab.locator('.de-composition a[href="https://www.instagram.com/mycreator/"]').count() !== 1) throw Error("Social URL edit missing");
  await lab.getByRole("button", { name: "Remove metric 4", exact: true }).click();
  await lab.getByRole("button", { name: "Remove profile 4", exact: true }).click();
  checks.push({ case: "social-edit-add-remove" });
  await lab.getByRole("tab", { name: "Layout", exact: true }).click();
  await lab.getByLabel("Section type", { exact: true }).selectOption("about");
  await lab.getByRole("button", { name: "About Me", exact: true }).click();
  await lab.getByLabel("Name", { exact: true }).fill("Jordan");
  await lab.getByLabel("Name", { exact: true }).blur();
  await lab.getByLabel("Biography", { exact: true }).fill("Coffee, workouts and creative stories.\n\nA biography in my own words.");
  await lab.getByLabel("Biography", { exact: true }).blur();
  await lab.getByRole("button", { name: "Add interest", exact: true }).click();
  await lab.getByRole("button", { name: "Remove interest 4", exact: true }).click();
  await lab.getByLabel("Include second snapshot", { exact: true }).uncheck();
  if (await lab.locator(".de-creator-snapshot").count()) throw Error("Second image was not removed");
  await lab.getByLabel("Include second snapshot", { exact: true }).check();
  const media = lab.locator(".composition-media-controls");
  await media.locator("summary").click();
  await media.getByLabel("Creator photograph · content · image", { exact: true }).selectOption("creator-neutral-dark/gym");
  await page.locator('.de-creator-portrait img[src*="neutral-dark-gym"]').waitFor();
  if (!(await lab.locator(".de-creator-bio").innerText()).includes("Jordan")) throw Error("About edit missing");
  const serialized = await lab.locator("pre").last().innerText();
  for (const text of ["420K", "instagram.com/mycreator", "Jordan", "neutral-dark-gym"]) if (!serialized.includes(text)) throw Error(`Persisted JSON missing ${text}`);
  await page.waitForFunction(() => Object.values(localStorage).some(json => json.includes("neutral-dark-gym") && json.includes("420K") && json.includes("Jordan")));
  // The real editor changes history to /admin/lab; this disposable static host lives at /?lab.
  await page.goto(`${url}/?lab`);
  await page.locator(".lab-workspace-switch:visible").getByRole("button", { name: "Composition", exact: true }).click();
  await page.locator('.de-creator-portrait img[src*="neutral-dark-gym"]').waitFor();
  if (!(await page.locator(".composition-lab .de-composition").innerText()).includes("420K")) throw Error("Edits did not survive reload");
  checks.push({ case: "about-edit-media-persistence" });
  await page.screenshot({ path: `${output}/editor-custom-content.png` });
  await page.goto(`${url}/design-engine-creators/index.html`);
  await page.setViewportSize({ width: 1440, height: 1900 });
  await page.locator("img").evaluateAll(async images => { await Promise.all(images.map(image => image.decode())); });
  if (await page.locator("img").count() !== 28) throw Error("Incomplete photo index");
  await page.screenshot({ path: `${output}/creator-contact-sheet.png`, fullPage: true });
  checks.push({ case: "28-delivered-photos" });
  if (errors.length) throw Error(errors.join("\n"));
  await writeFile(`${output}/browser-results.json`, JSON.stringify({ checks, errors }, null, 2));
  console.log(`${checks.length} creator section browser checks passed.`);
} finally { await browser.close(); }
