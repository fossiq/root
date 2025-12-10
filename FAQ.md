# Fossiq Development FAQ

Common questions and answers about developing in the Fossiq monorepo.

## Architecture & Design

### Why do all packages target the browser first?

Fossiq is fundamentally a browser-first, WASM-based KQL tooling suite. All packages are designed to work in the browser using WebAssembly:

- **Browser as primary target**: Tree-sitter WASM parser, DuckDB WASM, CodeMirror editor
- **Multi-runtime support**: Packages also work in Node.js and Bun as a bonus, not a primary design goal
- **WASM dependency**: Core parsing and execution rely on WASM binaries

This differs from typical npm packages that target Node.js primarily and add browser support later.

### Why do I see "fs/promises" and "module" warnings in the Vite build?

**Question**: During `bun run build` in the UI package, Vite warns:
```
Module "fs/promises" has been externalized for browser compatibility, 
imported by "web-tree-sitter/tree-sitter.js"
```

**Answer**: `web-tree-sitter` is a browser-first parser that includes fallback code for maximum runtime compatibility. It has conditional requires for Node.js modules (`fs/promises`, `module`) that are only used in Node.js environments.

**Why this is expected**:
- `web-tree-sitter` is WASM-based and works perfectly in browsers (those requires are never executed)
- Vite warns because it detects these Node.js imports in the source code
- The warnings are **not errors** - the build succeeds and the app works correctly
- The fallback code is intentionally there to support `web-tree-sitter` in multiple runtimes

**Why we don't suppress the warning**:
- Suppressing warnings hides architectural issues
- These warnings correctly alert developers to Node.js-specific code in browser packages
- The warnings are informative: they indicate we're using browser-first packages correctly
- No action needed - just be aware this is expected

**What this means for development**:
- These warnings are safe to ignore during development
- They do not affect the final bundle (Vite handles WASM externalization correctly)
- If you introduce new Node.js-specific code, similar warnings will alert you

## Package Development

### How do I add a new operator to kql-parser?

See the detailed step-by-step guide in `.github/instructions/kql-parser-dev.md` under "Adding a New Operator".

Key steps:
1. Define types in `src/types.ts`
2. Add grammar rules in `src/grammar/rules.ts`
3. Register rules in `src/grammar/index.ts`
4. Create builders in `src/builders/operators.ts`
5. Wire up in `src/builders/index.ts`
6. Add tests and update status docs

### Why does kql-parser build output grammar.js with CommonJS syntax when package.json says "type": "module"?

**The Issue**: Tree-sitter-cli needs to load `grammar.js` as a CommonJS module (it expects `module.exports`). But when Node.js sees `"type": "module"` in package.json, it treats all `.js` files as ES modules, causing:

```
ReferenceError: module is not defined in ES module scope
```

**The Solution**: We use a build script (`scripts/generate.sh`) that:
1. Compiles grammar to CommonJS syntax (`grammar.js` with `module.exports`)
2. **Temporarily removes** `"type": "module"` from package.json
3. Runs `tree-sitter-cli generate` (which expects CommonJS)
4. **Restores** `"type": "module"` to package.json

This allows both requirements to coexist:
- Source code uses ESM (`"type": "module"`)
- Grammar generation uses CommonJS (tree-sitter-cli requirement)

**Why this approach**:
- Tree-sitter-cli is a mature C++ tool that predates ES modules
- Renaming to `grammar.cjs` doesn't work because tree-sitter-cli explicitly looks for `grammar.js`
- Temporary package.json modification is the cleanest solution without patching tree-sitter-cli

## Build & CI

### Why does the CI workflow have separate build_bindings and build-test-publish jobs?

The workflow uses a **multi-stage build pattern**:

1. **build_bindings** (parallel on multiple OS/arch):
   - Builds native tree-sitter bindings for Linux, Windows, macOS, ARM64
   - Runs in parallel across platforms
   - Uploads artifacts

2. **build-test-publish** (depends on build_bindings):
   - Downloads all pre-built bindings
   - Builds TypeScript packages
   - Runs tests
   - Publishes to npm

**Why**: Native bindings are platform-specific and slow to build. Parallelizing across platforms saves time while ensuring all artifacts are available before tests run.

### What are changesets and why are they required?

**Changesets** are version management for the monorepo:

- **One changeset per feature/fix** describing what changed and version bump (patch/minor/major)
- **Automated releases** via GitHub Actions when merged to main
- **Changelog generation** from changeset descriptions

**Required for PRs** because:
- Ensures version bumps are intentional
- Documents what changed for each package
- Prevents accidental breaking changes (you must explicitly choose "major")

**How to use**:
```bash
bun run changeset
```

Then commit the generated `.changeset/*.md` file.

## Troubleshooting

### The build fails with "Grammar compilation failed"

Check that you've run `bun install` and all dependencies are available. The compile step requires `tree-sitter-cli` to be installed.

### Tests pass locally but fail in CI

Common causes:
- Missing changeset file (required for package changes)
- Linting errors (run `bun run lint:fix`)
- Platform-specific issues (CI runs on Linux)

Check the CI logs for details and run locally:
```bash
bun run lint
bun run build
bun run test
```

### How do I update documentation in .github/instructions/?

These files are **automatically indexed** by AI agents:
- Each package has a status file (e.g., `kql-parser-status.md`) for current state
- Each package has a dev guide (e.g., `kql-parser-dev.md`) for implementation details
- General guidelines in `meta.md` and `monorepo.md`

After completing a feature:
1. Update the status file checklist
2. Add any new patterns/gotchas to the dev guide
3. This preserves knowledge for future sessions (AI agents have no memory)
