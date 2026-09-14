// Generate types/database.types.ts from a PostgreSQL that has the migrations
// applied, without Docker or a linked Supabase project.
//
//   KEEP_DB=1 scripts/db-validate.sh          # prints the kept database name
//   node scripts/db-gen-types.mjs postgres://postgres@127.0.0.1:54329/<db> > types/database.types.ts
//
// Needs @supabase/postgres-meta and @supabase/postgrest-typegen resolvable from
// the working directory (install them into a scratch folder and run from there,
// or `npm i --no-save @supabase/postgres-meta`). With a linked project use
// `npx supabase gen types typescript --linked --schema public --schema vigil` instead.
import { PostgresMeta } from '@supabase/postgres-meta/dist/lib/index.js';
import { getGeneratorMetadata } from '@supabase/postgres-meta/dist/lib/generators.js';
import { generateTypescript } from '@supabase/postgrest-typegen';

const connectionString = process.argv[2];
if (!connectionString) {
  console.error('usage: node scripts/db-gen-types.mjs <postgres-url>');
  process.exit(2);
}

const pgMeta = new PostgresMeta({ connectionString, max: 2 });
const { data, error } = await getGeneratorMetadata(pgMeta, {
  includedSchemas: ['public', 'vigil'],
  excludedSchemas: [],
});
if (error) {
  console.error(error);
  process.exit(1);
}
const out = await generateTypescript(data, {
  detectOneToOneRelationships: true,
  defaultSchema: 'public',
});
process.stdout.write('// Generated from supabase/migrations by scripts/db-gen-types.mjs — do not edit by hand.\n');
process.stdout.write('// Regenerate after every migration: see docs/dashboard-v1/IMPLEMENTATION_LOG.md.\n\n');
process.stdout.write(typeof out === 'string' ? out : JSON.stringify(out));
await pgMeta.end?.();
