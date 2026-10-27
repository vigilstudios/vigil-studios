// Standalone, loopback-only design lab with fictional data. No auth bypass or production fixture route.
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = fileURLToPath(new URL("../", import.meta.url));
const stub = path.join(root, "scripts/overview-preview/next-stubs.tsx");
const server = await createServer({
  configFile: false,
  root: path.join(root, "scripts/overview-preview"),
  publicDir: path.join(root, "public"),
  resolve: {
    alias: [
      { find: "next/navigation", replacement: stub },
      { find: "next/link", replacement: stub },
      {
        find: "next/image",
        replacement: path.join(root, "scripts/lead-hub-preview/image-stub.ts"),
      },
      { find: "@", replacement: root },
    ],
  },
  css: { postcss: root },
  server: {
    host: "127.0.0.1",
    port: 4188,
    strictPort: true,
    fs: { allow: [root] },
  },
});
await server.listen();
server.printUrls();
