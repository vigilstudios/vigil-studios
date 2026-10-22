// Local sample-data lab. No dashboard route, credentials, network API or auth bypass.
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
const stubs = path.join(root, 'scripts/lead-hub-preview/next-stubs.tsx');
const server = await createServer({
  configFile: false,
  root: path.join(root, 'scripts/lead-hub-preview'),
  publicDir: path.join(root, 'public'),
  resolve: { alias: [
    { find: 'next/navigation', replacement: stubs },
    { find: 'next/link', replacement: stubs },
    { find: 'next/image', replacement: path.join(root, 'scripts/lead-hub-preview/image-stub.ts') },
    { find: '@', replacement: root },
  ] },
  css: { postcss: root },
  server: { host: '127.0.0.1', port: 4187, strictPort: true, fs: { allow: [root] } },
});
await server.listen(); server.printUrls();
