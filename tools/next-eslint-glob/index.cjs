// Next's CommonJS lint plugin imports this module with require().
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { globSync, isDynamicPattern } = require("tinyglobby");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { isAbsolute } = require("node:path");

// Only the single-pattern directory lookup used by Next 16.3.8 is supported.
exports.globSync = (pattern, options) => {
  if (typeof pattern !== "string" || options?.onlyDirectories !== true) {
    throw new TypeError("Next ESLint glob adapter requires a directory pattern");
  }
  // Picomatch does not preserve fast-glob's multi-digit/step range semantics.
  // Fail explicitly; use comma alternatives instead of silently missing roots.
  if (/\{[^{}]*\.\.[^{}]*\}/.test(pattern)) {
    throw new SyntaxError("Next ESLint rootDir ranges are unsupported; use explicit comma alternatives");
  }
  const marked = pattern.endsWith("/") && !isDynamicPattern(pattern);
  const glob = pattern === "**" || pattern.endsWith("/**") ? `${pattern}/*` : pattern;
  return globSync(glob, {
    ...options,
    expandDirectories: false,
    absolute: options.absolute ?? isAbsolute(pattern),
  }).map((path) =>
    !marked && path.endsWith("/") && path !== "/" && !/^[a-z]:\/$/i.test(path)
      ? path.slice(0, -1)
      : path,
  );
};
