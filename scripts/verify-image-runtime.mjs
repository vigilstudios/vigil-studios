import assert from "node:assert/strict";
import sharp from "sharp";

// Check the loaded native library, including environments with global libvips.
// This build gate writes versions only; it never reads provider configuration.
assert.equal(sharp.versions.sharp, "0.35.5", "Review the pinned sharp security baseline");
assert.equal(sharp.versions.rsvg, "2.63.2", "Unexpected loaded librsvg; review the native security baseline");
const png = await sharp(Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><rect width="8" height="8" fill="red"/></svg>',
)).png().toBuffer();
const metadata = await sharp(png).metadata();
assert.equal(metadata.width, 8);
assert.equal(metadata.height, 8);
console.log("[image-runtime] " + JSON.stringify({
  platform: process.platform, arch: process.arch, node: process.version,
  sharp: sharp.versions.sharp, librsvg: sharp.versions.rsvg, libvips: sharp.versions.vips,
  benignSvgDecode: "passed",
}));
