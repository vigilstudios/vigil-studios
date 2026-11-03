// Loopback-only preview with fictional data; no auth bypass or production fixture route.
import { createServer } from "vite";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { readFileSync } from "node:fs";
const root = fileURLToPath(new URL("../", import.meta.url));
const stub = path.join(root, "scripts/measurements-preview/next-stubs.tsx");
const server = await createServer({
  configFile: false,
  plugins: [
    {
      name: "fixed-preview-assets",
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const file = req.url?.split("?")[0];
          if (file !== "/sample-site.html" && file !== "/sample-icon.svg")
            return next();
          res.setHeader(
            "Content-Type",
            file.endsWith(".svg") ? "image/svg+xml" : "text/html",
          );
          res.end(
            readFileSync(
              path.join(root, "scripts/overview-preview", file.slice(1)),
            ),
          );
        });
      },
    },
  ],
  root: path.join(root, "scripts/measurements-preview"),
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
    port: 4193,
    strictPort: true,
    fs: { allow: [root] },
  },
});
await server.listen();
server.printUrls();
