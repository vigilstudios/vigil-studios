import { build } from "esbuild";
import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

// Immutable, content-addressed distribution; never delete older versions here.
const result = await build({ entryPoints: ["design-engine/runtime/client.tsx"], bundle: true,
  minify: true, write: false, outdir: "runtime", entryNames: "client", jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' }, loader: { ".png": "file", ".jpg": "file", ".webp": "file" } });
const files = result.outputFiles.map(file => ({ path: path.basename(file.path), bytes: file.contents }));
const faces = { fraunces: "fraunces", "bodoni-moda": "bodoni", "public-sans": "public", jost: "jost", anton: "anton", "source-sans-3": "source", "ibm-plex-mono": "plex", "archivo-black": "archivo", recursive: "recursive", "cormorant-garamond": "cormorant" };
let css = "*{box-sizing:border-box}body{margin:0}button,a{touch-action:manipulation}";
for (const family of Object.keys(faces)) {
  files.push({ path: `LICENSE.font-${family}.txt`, bytes: await readFile(`design-engine/preview/fonts/${family}/LICENSE`) });
  for (const file of (await readdir(`design-engine/preview/fonts/${family}`)).sort()) {
    if (!file.endsWith(".woff2")) continue;
    files.push({ path: file, bytes: await readFile(`design-engine/preview/fonts/${family}/${file}`) });
    css += `@font-face{font-family:vigil-${family};src:url(./${file});font-weight:${file.match(/-(400|500)-/)?.[1] ?? "100 900"};font-style:${file.includes("italic") ? "italic" : "normal"};font-display:swap}`;
  }
}
css += `:root{${Object.entries(faces).map(([family, variable]) => `--de-face-${variable}:vigil-${family}`).join(";")}}`;
files.push({ path: "fonts.css", bytes: Buffer.from(css) });
files.sort((a,b) => a.path.localeCompare(b.path));
const hash = createHash("sha256");
files.forEach(file => hash.update(file.path).update(file.bytes));
const version = `v1-${hash.digest("hex").slice(0,20)}`;
const output = `public/design-engine-runtime/${version}`;
await mkdir(output, { recursive: true });
const manifest = { version, schemaVersion: 1, files: files.map(file => ({ path: file.path, sha256: createHash("sha256").update(file.bytes).digest("hex") })) };
for (const file of files) await writeFile(`${output}/${file.path}`, file.bytes);
await writeFile(`${output}/manifest.json`, JSON.stringify(manifest, null, 2));
await writeFile("public/design-engine-runtime/manifest.json", JSON.stringify(manifest, null, 2));
console.log(`Pinned Design Engine distribution ${version} (${files.length} files)`);
