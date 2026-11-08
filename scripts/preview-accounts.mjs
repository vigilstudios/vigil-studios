// Fictional loopback review only: no Auth, payment, email or customer writes.
import { createServer } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const stub = path.join(root, "scripts/account-preview/stubs.ts");
const server = await createServer({
  configFile: false,
  root: path.join(root, "scripts/account-preview"),
  publicDir: path.join(root, "public"),
  resolve: {
    alias: [
      { find: "@/lib/vigil/auth/actions", replacement: stub },
      { find: "@/lib/vigil/actions/account", replacement: stub },
      { find: "@/lib/vigil/queries/account", replacement: stub },
      {
        find: "next/navigation",
        replacement: path.join(
          root,
          "scripts/measurements-preview/next-stubs.tsx",
        ),
      },
      {
        find: "next/link",
        replacement: path.join(
          root,
          "scripts/measurements-preview/next-stubs.tsx",
        ),
      },
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
    port: 4195,
    strictPort: true,
    fs: { allow: [root] },
  },
});
await server.listen();
server.printUrls();
