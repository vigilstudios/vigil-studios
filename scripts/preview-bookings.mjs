// Loopback-only review, fictional records, no auth bypass and no live booking writes.
import {createServer} from 'vite';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url)),stub=path.join(root,'scripts/bookings-preview/stubs.ts'),nextStub=path.join(root,'scripts/measurements-preview/next-stubs.tsx');
const server=await createServer({configFile:false,root:path.join(root,'scripts/bookings-preview'),publicDir:path.join(root,'public'),resolve:{alias:[{find:'@/lib/vigil/auth/session',replacement:stub},{find:'@/lib/vigil/entitlements',replacement:stub},{find:'@/lib/vigil/queries/dashboard',replacement:stub},{find:'@/lib/vigil/bookings/google/service',replacement:stub},{find:'@/lib/vigil/actions/bookings',replacement:stub},{find:'@/lib/vigil/queries/bookings',replacement:stub},{find:'next/navigation',replacement:nextStub},{find:'next/link',replacement:nextStub},{find:'next/image',replacement:path.join(root,'scripts/lead-hub-preview/image-stub.ts')},{find:'@',replacement:root}]},css:{postcss:root},server:{host:'127.0.0.1',port:4194,strictPort:true,fs:{allow:[root]}}});await server.listen();server.printUrls();
