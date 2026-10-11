# Next ESLint directory-glob adapter

This private development package replaces only fast-glob under the pinned @next/eslint-plugin-next 16.3.8. That plugin uses the named CommonJS globSync export with a single string and onlyDirectories: true. The adapter delegates to maintained tinyglobby 0.2.17, removing the fast-glob → micromatch → braces dependency chain (GHSA-vfj7-8cjw-p6xm).

It disables implicit directory expansion, preserves absolute-pattern output and static trailing slashes, removes directory markers from ordinary matches, and excludes the base directory for trailing globstars. It supports the directory patterns exercised by the regression suite, including wildcards, globstars, comma alternatives, nested alternatives and extglobs. It is not a general fast-glob replacement: no callable default, stream or task API is provided.

Numeric/step brace ranges are explicitly rejected because picomatch and fast-glob differ for multi-digit ranges. Use comma alternatives such as apps/{v1,v2,v10}. The current repository does not configure next.rootDir, so this restriction changes no current configuration. Invalid adapter call shapes fail explicitly.

Run npm run test:dependency-security after dependency changes. CI does this after type checking. The checks resolve the actual Next plugin dependency, assert the vulnerable package is absent from the lock, exercise directory matching and the real no-html-link-for-pages rule, and run below-limit deep-pattern regressions in a bounded child process.

Maintenance owner: repository integrator. When upgrading Next/eslint-config-next, review the plugin's glob API and upstream dependency chain. The version-scoped override and installed-graph regression must be updated deliberately. Remove this adapter only when upstream no longer installs vulnerable braces and equivalent lint behavior is verified. Do not restore fast-glob merely to make an upgrade install.

Sources: https://github.com/advisories/GHSA-vfj7-8cjw-p6xm, https://superchupu.dev/tinyglobby/documentation, https://docs.npmjs.com/cli/v11/configuring-npm/package-json#overrides.
