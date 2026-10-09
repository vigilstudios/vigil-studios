// Run from the repository root. Generates a loopback-only disposable QA fixture bundle.
import { build } from "esbuild";
import { writeFile, mkdir, readdir, copyFile, cp } from "node:fs/promises";
const output = process.env.DESIGN_ENGINE_QA_OUTPUT || "/tmp/vigil-creator-editor-qa";
await mkdir(output, { recursive: true });
await build({
  entryPoints: [process.env.DESIGN_ENGINE_QA_ENTRY || "scripts/design-engine-creator-editor-qa.tsx"],
  bundle: true,
  minify: true,
  publicPath: "/",
  outdir: output,
  entryNames: "qa",
  assetNames: "assets/[name]-[hash]",
  loader: { ".jpg": "file", ".webp": "file", ".png": "file" },
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  metafile: true,
  write: true,
}).then((result) =>
  writeFile(
    `${output}/bundle-report.json`,
    JSON.stringify(result.metafile, null, 2),
  ),
);
await writeFile(
  `${output}/index.html`,
  '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Creator editor QA</title><link rel="icon" href="data:,"><link rel="stylesheet" href="qa.css"><style>*{box-sizing:border-box}body{margin:0;font-family:Arial,sans-serif}.lab-editor :is(h1,h2,h3,h4,p){margin:0 0 .7em}.qa-controls{display:flex;flex-wrap:wrap;gap:12px;background:#eee;color:#111;padding:12px;font:14px sans-serif}.qa-controls label{display:grid;gap:4px}.qa-controls select{max-width:calc(100vw - 24px);min-height:44px}.qa-controls~.de-composition #approach{min-height:1100px}.de-root{--de-font-display:Georgia,serif;--de-font-heading:Arial,sans-serif;--de-font-body:Arial,sans-serif}</style></head><body><div id="root"></div><script src="qa.js"></script></body></html>',
);
await cp(
  "public/design-engine-study-007",
  `${output}/design-engine-study-007`,
  { recursive: true },
);
console.log(`QA bundle: ${output}`);

let faces = "";
for (const entry of await readdir("design-engine/preview/fonts", {
  withFileTypes: true,
})) {
  if (!entry.isDirectory()) continue;
  const family = entry.name;
  for (const file of await readdir(`design-engine/preview/fonts/${family}`))
    if (file.endsWith(".woff2")) {
      await copyFile(
        `design-engine/preview/fonts/${family}/${file}`,
        `${output}/assets/${file}`,
      );
      const weight = file.match(/-(400|500)-/)?.[1] ?? "100 900";
      faces += `@font-face{font-family:qa-${family};src:url(/assets/${file});font-weight:${weight};font-style:${file.includes("italic") ? "italic" : "normal"};font-display:swap}`;
    }
}
await writeFile(
  `${output}/fonts.css`,
  faces +
    ":root{--de-face-fraunces:qa-fraunces;--de-face-bodoni:qa-bodoni-moda;--de-face-public:qa-public-sans;--de-face-jost:qa-jost;--de-face-anton:qa-anton;--de-face-source:qa-source-sans-3;--de-face-plex:qa-ibm-plex-mono;--de-face-archivo:qa-archivo-black;--de-face-recursive:qa-recursive;--de-face-cormorant:qa-cormorant-garamond;--bg-primary:#f4f4f2;--bg-secondary:#ffffff;--bg-surface:#ffffff;--bg-surface-soft:#e9eee9;--text-secondary:#5b625c;--text-primary:#222;--border:#bbb;--accent:#345b4c}",
);
const { readFile } = await import("node:fs/promises");
await writeFile(
  `${output}/index.html`,
  (await readFile(`${output}/index.html`, "utf8")).replace(
    '<link rel="stylesheet" href="qa.css">',
    '<link rel="stylesheet" href="qa.css"><link rel="stylesheet" href="fonts.css">',
  ),
);

if (process.env.DESIGN_ENGINE_AXE)
  await copyFile(process.env.DESIGN_ENGINE_AXE, `${output}/axe.js`);

await cp(
  "public/design-engine-study-005",
  `${output}/design-engine-study-005`,
  { recursive: true },
);

await cp(
  "public/design-engine-study-003b",
  `${output}/design-engine-study-003b`,
  { recursive: true },
);
await cp(
  "public/design-engine-study-006",
  `${output}/design-engine-study-006`,
  { recursive: true },
);
await cp("public/design-engine-commerce", `${output}/design-engine-commerce`, {
  recursive: true,
});

await cp(
  "public/design-engine-study-008",
  `${output}/design-engine-study-008`,
  { recursive: true },
);

for (const folder of ["creative-calibration-002","creative-collection-001","creative-collection-005"]) await cp(`docs/design-engine/${folder}/assets`,`${output}/docs/design-engine/${folder}/assets`,{recursive:true});

await cp("public/design-engine-creators", `${output}/design-engine-creators`, {recursive:true});
