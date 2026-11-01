// ESLint plugins still call minimatch v3's CommonJS function; newer consumers
// destructure its named exports. Delegate both interfaces to the patched engine.
// eslint-disable-next-line @typescript-eslint/no-require-imports -- CommonJS is required by the legacy lint consumers.
const engine = require('@vigil/minimatch-engine');
function compatible(api) {
  const match = typeof api === 'function' ? api : api.minimatch;
  const callable = (path, pattern, options) => match(path, pattern, options);
  Object.assign(callable, api);
  callable.minimatch = callable;
  // eslint-plugin-import consumes only makeRe(...).test(path). v11 removed
  // regex compilation, so preserve that predicate interface without reintroducing ReDoS.
  callable.makeRe = (pattern, options) => {
    const matcher = new api.Minimatch(pattern, options);
    return { test: path => matcher.match(path) };
  };
  callable.defaults = options => compatible(match.defaults(options));
  return callable;
}
module.exports = compatible(engine);
