import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
await mkdir("public/integrations", {recursive:true});
await build({entryPoints:["lib/vigil/contact/public-runtime.ts"],bundle:true,minify:true,format:"iife",globalName:"VigilContact",target:"es2020",outfile:"public/integrations/vigil-contact-v1.js"});
console.log("Built shared Vigil contact browser adapter v1");
