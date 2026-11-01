import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";
import { test } from "node:test";
const require = createRequire(import.meta.url);
const match = require("minimatch");
test("all lint consumers resolve the patched matching engine through compatible exports", () => {
  assert.equal(require("minimatch/package.json").name, "@vigil/eslint-minimatch");
  assert.equal(require("@vigil/minimatch-engine/package.json").version, "11.0.3");
  for (const consumer of ["eslint", "@eslint/config-array", "@eslint/eslintrc", "eslint-plugin-import", "eslint-plugin-react", "eslint-plugin-jsx-a11y", "@typescript-eslint/typescript-estree"]) {
    const local = createRequire(require.resolve(consumer));
    assert.equal(local("minimatch"), match, consumer);
  }
  assert.equal(match.minimatch, match);
});
test("preserves callable, named and constructor APIs for lint patterns and ignores", () => {
  for (const [path, pattern, options, expected] of [
    ["app/a.tsx", "**/*.tsx", {}, true],
    ["app/a.js", "**/*.tsx", {}, false],
    [".hidden/a.ts", "**/*.ts", {}, false],
    [".hidden/a.ts", "**/*.ts", { dot: true }, true],
    ["a.jsx", "*.{jsx,tsx}", {}, true],
    ["a.tsx", "*.@(jsx|tsx)", {}, true],
    ["file.test.ts", "!*.test.ts", {}, false],
    ["A.TS", "*.ts", { nocase: true }, true],
    ["dir/a.ts", "*.ts", { matchBase: true }, true],
    ["dir/a.ts", "*.ts", {}, false],
  ]) {
    assert.equal(match(path, pattern, options), expected, `${path}: ${pattern}`);
    assert.equal(new match.Minimatch(pattern, options).match(path), expected);
  }
  assert.deepEqual(match.match(["a.ts", "b.js"], "*.ts"), ["a.ts"]);
  assert.deepEqual(["a.ts", "b.js"].filter(match.filter("*.ts")), ["a.ts"]);
  assert.equal(match.makeRe("*.ts").test("a.ts"), true);
  assert.deepEqual(match.braceExpand("*.{ts,js}"), ["*.ts", "*.js"]);
  assert.equal(match.defaults({ dot: true })(".test.ts", "*.ts"), true);
  assert.equal(new (match.defaults({ dot: true }).Minimatch)("*.ts").match(".test.ts"), true);
});
test("patched high-optimization preprocessing handles the advisory pattern within a bounded child process", () => {
  const child = spawnSync(process.execPath, ["-e", `const m=require('minimatch'); const p=Array.from({length:30},()=> '**/../').join('')+'*.ts'; try { new m.Minimatch(p,{optimizationLevel:2}); } catch(e) { if(!(e instanceof RangeError)) throw e; } console.log('completed');`], { encoding: "utf8", timeout: 5000 });
  assert.equal(child.error, undefined, child.error?.message);
  assert.equal(child.status, 0, child.stderr);
  assert.match(child.stdout, /completed/);
});

test("import boundary lint rule still rejects forbidden internal modules", () => {
  const { Linter } = require("eslint");
  const plugin = require("eslint-plugin-import");
  const messages = new Linter().verify("import x from 'pkg/private/file';", [{ languageOptions: { ecmaVersion: 2022, sourceType: "module" }, plugins: { import: plugin }, rules: { "import/no-internal-modules": ["error", { forbid: ["pkg/private/**"] }] } }]);
  assert.equal(messages.filter(m => m.ruleId === "import/no-internal-modules").length, 1);
});
