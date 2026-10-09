// Delivery encoding only; photo creation and edits use the built-in imagegen tool.
import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import sharp from "sharp";
import { createHash } from "node:crypto";

const prompts = [...JSON.parse(await readFile("docs/design-engine/creator-image-package/prompts.json", "utf8")), ...JSON.parse(await readFile("docs/design-engine/creator-image-package/candid-prompts.json", "utf8"))];
const output = "public/design-engine-creators";
const sources = "docs/design-engine/creator-image-package/originals";
await mkdir(output, { recursive: true });
await mkdir(sources, { recursive: true });
const descriptions = {
  gym: "Dumbbells, a gym bag, towel and water bottle after a workout",
  coffee: "Coffee and a partly eaten breakfast at a café table",
  drive: "The leather interior, sunglasses and keys of a parked vintage coupe",
  hero: "A creator setting up a camera at a desk, viewed from behind with their face hidden",
  product: "A hand arranging an unbranded skincare bottle and balm on fabric",
  pov: "A creator's hands reviewing a photograph on a digital camera at a desk",
  objects: "A compact camera, earbuds, notebook, coffee and tote on a tabletop",
};
const assets = [];
for (const prompt of prompts) {
  if (!prompt.source) throw Error(`Missing generated source for ${prompt.id}`);
  const original = `${sources}/${prompt.id}.png`;
  // Prefer the archived source so packaging works after the generation session ends.
  if (prompt.source && prompt.source !== original) await copyFile(prompt.source, original).catch(async error => {
    if (error.code !== "ENOENT") throw error;
    await readFile(original);
  });
  const bytes = await readFile(original);
  const metadata = await sharp(bytes).metadata();
  const base = `/design-engine-creators/${prompt.id}`;
  const full = await sharp(bytes).webp({ quality: 86 }).toBuffer();
  await writeFile(`${output}/${prompt.id}.webp`, full);
  for (const width of [640, 240]) {
    await sharp(bytes).resize({ width, withoutEnlargement: true }).webp({ quality: width === 640 ? 82 : 80 }).toFile(`${output}/${prompt.id}-${width}.webp`);
  }
  const thumb = await sharp(`${output}/${prompt.id}-240.webp`).metadata();
  assets.push({
    id: prompt.id, set: prompt.palette, role: prompt.role,
    src: `${base}.webp`, width: metadata.width, height: metadata.height,
    alt: `${descriptions[prompt.role]}. ${prompt.palette.replaceAll("-", " ")}; AI-generated creator demo photograph.`,
    srcSet: `${base}-640.webp 640w, ${base}.webp ${metadata.width}w`,
    thumbnail: { src: `${base}-240.webp`, width: thumb.width, height: thumb.height },
    bytes: full.length, sha256: createHash("sha256").update(full).digest("hex"),
    generator: "built-in imagegen", source: `originals/${prompt.id}.png`,
  });
}
const manifest = { id: "creators-v2", generatedOn: "2026-10-08", assets };
await writeFile(`${output}/manifest.json`, JSON.stringify(manifest, null, 2) + "\n");
await writeFile("docs/design-engine/creator-image-package/assets-manifest.json", JSON.stringify(manifest, null, 2) + "\n");
const rows = [...new Set(assets.map(a => a.set))].map(set =>
  `<section class="${set.endsWith("dark") ? "dark" : "light"}"><h2>${set.replaceAll("-", " / ")}</h2><div class="grid">${assets.filter(a => a.set === set).map(a => `<figure><a href="${a.id}.webp"><img src="${a.id}.webp" width="${a.width}" height="${a.height}" alt="${a.alt}"></a><figcaption>${a.role} · ${a.width} × ${a.height}</figcaption></figure>`).join("")}</div></section>`
).join("");
await writeFile(`${output}/index.html`, `<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Creator image package</title><style>*{box-sizing:border-box}body{margin:0;background:#e8e3de;color:#282222;font-family:system-ui,sans-serif}header{padding:36px}h1{margin:0 0 10px}p{max-width:760px;line-height:1.5}section{padding:28px 36px}.dark{background:#211c1e;color:#f5ede8}.light{background:#f8f1eb}.grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px}figure{margin:0}img{width:100%;height:260px;object-fit:cover;border-radius:6px}figcaption{margin-top:10px;text-transform:capitalize;font-size:13px}h2{text-transform:capitalize}@media(max-width:800px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}section,header{padding:22px}img{height:220px}}</style><header><h1>Creator image package</h1><p>28 candid digital-camera demo photographs. Pink and neutral, each in light and dark sets. Heroes, products, creator POVs, everyday objects, gym snapshots, café moments and car interiors.</p></header>${rows}</html>`);
console.log(`Packaged ${assets.length} images, ${assets.reduce((sum, a) => sum + a.bytes, 0)} bytes in full-size WebP assets.`);
