import { build } from "esbuild";
import { mkdir } from "node:fs/promises";
await mkdir("public/integrations", {recursive:true});
await build({entryPoints:["lib/vigil/contact/public-runtime.ts"],bundle:true,minify:true,format:"iife",globalName:"VigilContact",target:"es2020",outfile:"public/integrations/vigil-contact-v1.js"});
console.log("Built shared Vigil contact browser adapter v1");
await build({entryPoints:["lib/vigil/bookings/public-runtime.tsx"],bundle:true,minify:true,format:"iife",globalName:"VigilBookings",target:"es2020",jsx:"automatic",define:{"process.env.NODE_ENV":'"production"'},outfile:"public/integrations/vigil-bookings-v1.js"});
console.log("Built shared Vigil booking browser adapter v1");
