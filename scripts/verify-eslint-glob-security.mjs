import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

const require = createRequire(import.meta.url);
const configRequire = createRequire(require.resolve("eslint-config-next"));
const pluginFile = configRequire.resolve("@next/eslint-plugin-next");
const pluginRequire = createRequire(pluginFile);
const adapter = pluginRequire("fast-glob");
const { getRootDirs } = pluginRequire("./utils/get-root-dirs.js");
const fixture = mkdtempSync(join(tmpdir(), "vigil-eslint-globs-"));
const originalCwd = process.cwd();
for (const dir of ["alpha/pages", "alpha/nested", "beta/pages", "v1", "v2", "v3", ".hidden"]) {
  mkdirSync(join(fixture, "apps", dir), { recursive: true });
}
writeFileSync(join(fixture, "apps/alpha/pages/about.tsx"), "export default function Page() { return null; }\n");
writeFileSync(join(fixture, "apps/not-a-directory.txt"), "fixture\n");
process.chdir(fixture);
process.on("exit", () => { process.chdir(originalCwd); rmSync(fixture, { recursive: true, force: true }); });
const roots = (rootDir) => getRootDirs({ cwd: fixture, settings: { next: { rootDir } } }).sort();

test("installed Next plugin uses the pinned local adapter and no braces package remains", () => {
  assert.equal(pluginRequire("fast-glob/package.json").name, "@vigil/next-eslint-glob");
  const adapterRequire = createRequire(pluginRequire.resolve("fast-glob"));
  assert.equal(adapterRequire("tinyglobby/package.json").version, "0.2.17");
  const lock = JSON.parse(readFileSync(join(originalCwd, "package-lock.json"), "utf8"));
  assert.deepEqual(Object.keys(lock.packages).filter((p) => /(?:^|\/)node_modules\/braces$/.test(p)), []);
  // An upstream plugin API change must trigger an explicit compatibility review.
  assert.match(readFileSync(join(dirname(pluginFile), "utils/get-root-dirs.js"), "utf8"), /_fastglob\.globSync/);
  assert.deepEqual(Object.keys(adapter), ["globSync"]);
});

test("Next rootDir preserves directory matching without expanding literal directories", () => {
  for (const [pattern, expected] of [
    ["apps/alpha", ["apps/alpha"]],
    ["apps/alpha/", ["apps/alpha/"]],
    ["apps/{alpha,beta}", ["apps/alpha", "apps/beta"]],
    ["apps/{alpha,{beta,v1}}", ["apps/alpha", "apps/beta", "apps/v1"]],
    ["apps/v{1,2,3}", ["apps/v1", "apps/v2", "apps/v3"]],
    ["apps/@(alpha|beta)", ["apps/alpha", "apps/beta"]],
    ["apps/*", ["apps/alpha", "apps/beta", "apps/v1", "apps/v2", "apps/v3"]],
    ["apps\\alpha", ["apps/alpha"]],
    ["apps/missing", []],
  ]) assert.deepEqual(roots(pattern), expected, pattern);
  assert.deepEqual(roots(["apps/alpha", "apps/beta", false]), ["apps/alpha", "apps/beta"]);
  assert.throws(() => roots("apps/v{1..10}"), /use explicit comma alternatives/);
  assert.throws(() => roots("apps/v{1..3}"), /use explicit comma alternatives/);
  assert.deepEqual(roots("apps/alpha/**"), ["apps/alpha/nested", "apps/alpha/pages"]);
  assert.deepEqual(roots(undefined), [fixture]);
  assert.deepEqual(roots(join(fixture, "apps/alpha")), [join(fixture, "apps/alpha")]);
});

test("replacement still enforces Next's no-html-link-for-pages rule with globbed rootDir", () => {
  const { Linter } = require("eslint");
  const plugin = pluginRequire("@next/eslint-plugin-next");
  const linter = new Linter();
  const messages = linter.verify('<a href="/about">About</a>', [{
    files: ["**/*.jsx"],
    languageOptions: { ecmaVersion: "latest", sourceType: "module", parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { "@next/next": plugin },
    settings: { next: { rootDir: "apps/{alpha,beta}" } },
    rules: { "@next/next/no-html-link-for-pages": "error" },
  }], { filename: "fixture.jsx" });
  assert.equal(messages.filter((m) => m.ruleId === "@next/next/no-html-link-for-pages").length, 1);
});

test("deep brace and parenthesis patterns do not exhaust the replacement's stack", () => {
  const child = spawnSync(process.execPath, ["--input-type=module", "-e", `
    import { createRequire } from 'node:module';
    const req = createRequire(${JSON.stringify(pluginFile)});
    const { getRootDirs } = req('./utils/get-root-dirs.js');
    const n = 4998;
    for (const pattern of [
      '{'.repeat(n) + 'a,b' + '}'.repeat(n),
      '{'.repeat(n) + 'a,b',
      '('.repeat(n) + 'x' + ')'.repeat(n),
    ]) {
      const result = getRootDirs({cwd: process.cwd(), settings: {next: {rootDir: pattern}}});
      if (!Array.isArray(result)) throw Error('Expected directory results');
    }
    console.log('deep-pattern checks completed');
  `], { cwd: fixture, encoding: "utf8", timeout: 20000 });
  assert.equal(child.error, undefined, child.error?.message);
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /deep-pattern checks completed/);
});
