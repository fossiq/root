# Fossiq Agent Instructions

## CRITICAL RULES (violations = failure)
- NO auto-commit; ask "Commit with: [msg]?" before every `git commit`; wait explicit yes
- ALWAYS `git fetch origin && git pull origin main` before new branches
- NO global tool installs (`brew`, `npm install -g`) without explicit approval
- NO Docker container starts without approval
- NO issue/PR/comment without disclaimer: `---\n_This {issue|PR|comment} was created by an AI agent on behalf of @<username>._` (get username: `gh api user -q .login`)
- NO suppressing warnings/errors/logs — always ask user

## COMMUNICATION
- C4: Clear Concise Correct Complete. No summaries/apologies. Markdown+code blocks. `path/file.ts#L1-10` refs.

## RUNTIME
- Bun only: `bun x` not npx, `bun run` not npm run, `bun test` not jest/vitest
- TypeScript ESM, functional/pure preferred
- Search docs before assuming library behavior (WebSearch or context7 MCP)

## CODE QUALITY
- Files <150 lines; small single-responsibility functions
- No `any` without `@typescript-eslint/no-explicit-any` + comment
- No barrel files (index.ts re-exports); import directly
- No planning terms ("phase1") in names/comments
- `bun run lint` to check; `bun run lint:fix` to fix
- Error handling: descriptive messages

## DEBUGGING CONTEXT TO PROVIDE UPFRONT
- Exact file paths+line ranges, git branch/SHA, full error/stack, test counts, build artifact status
- Never make user discover repo structure, branches, tests, deps, labels

## BUILD SYSTEM
```
bun install          # REQUIRED after clone; sets up workspace symlinks
bun run build        # all packages via turbo
cd packages/X && bun run build   # single package
bun test             # tests
bun run lint / lint:fix
```

## MONOREPO STRUCTURE
- `packages/` workspaces, `@fossiq/kebab-case` naming, internal deps `workspace:*`
- Build order deps: `kql-ast` → `kql-lezer` → `kql-to-duckdb` → `ui`
- After adding package: dir + package.json + copy tsconfig.json + minimal src/index.ts

## GITHUB
- `gh` CLI only
- Actions debug: `gh run view <id>` → `gh run view <id> --job=<jid>` → `gh run view --log-failed --job=<jid>`

## TESTING
- No testing during dev; test after source changes with `bun test`
- `cd packages/<pkg> && bun test`

## MCP SERVERS
Prefer MCP over manual searches when available.

---

## PACKAGE GUIDES

### @fossiq/lezer-grammar-generator
- Generates Lezer `.grammar` files from TypeScript DSL
- dist/index.js = compiled; src/ = sources. dist is what bun uses (resolves via package.json "main")
- **BUG FIXED**: `convertRegexToLezer` step5 `(?<!!)\[` must be `(?<![$!])\[` to prevent double-processing `$[0-9]`
- `$[0-9]` = lezer char class syntax; `@digit` = INVALID in lezer-generator CLI (do NOT use)
- `kw("term")` → raw `kw<"term">` → expands via macro to `@specialize[@name=term]<Identifier, "term">`
- `seq(kw("a"), kw("b"))` in a rule = two-token compound operator; `slice(node)` returns `"a b"` (with whitespace from source)

### @fossiq/kql-ast
- Shared AST types only; build with `tsc`
- Must build BEFORE kql-lezer (kql-lezer imports types)

### @fossiq/kql-lezer
- KQL parser, no WASM
- Grammar sources (EDIT THESE): `src/grammar/` (TypeScript DSL)
- Generated (DO NOT EDIT, gitignored): `src/kql.grammar`, `src/parser.ts`, `src/parser.terms.ts`
- Build: `bun run build` → generate:grammar → build:parser → fix:parser → tsc
- CST→AST: `src/parser/cst-to-ast/`; `slice(node)` extracts raw source text for operator name
- `StringOp` grammar rule: operators are rule alternatives; compound `matches regex` = `seq(kw("matches"), kw("regex"))`
- Status: 110 tests passing (after fixes: 154 expects)

### @fossiq/kql-to-duckdb
- Translates KQL AST → DuckDB SQL
- Translator: `src/translator/expressions/index.ts`
- Operator string from CST is raw source text (e.g. `"matches regex"` with space)
- `matches regex` → `regexp_matches(col, pattern)` [FIXED]
- `contains` → `LIKE '%val%'`, `startswith` → `LIKE 'val%'`, `endswith` → `LIKE '%val'`
- `has` → `REGEXP '\bval\b'`, `in` → `IN (...)`, `between` → `BETWEEN x AND y`
- Status: 13 tests passing

### @fossiq/ui
- SolidJS + Vite + PicoCSS + CodeMirror6 + DuckDB WASM + TanStack Table
- DuckDB files in `public/`; theme via DOM classes; grid truncation needs `min-width: 0`
- PWA: `public/manifest.json` + `public/sw.js` + `index.html`
- **Chrome app icon**: Chrome ignores `data:` URI icons in manifest. Must be actual file paths (PNG preferred). Use `bun run generate-icons` to regenerate `public/icon-192.png`, `public/icon-512.png`; `public/icon.svg` for browser favicon
- Icon generation: `packages/ui/scripts/generate-icons.ts` (pure TS, no native deps, uses `Bun.deflateSync` for PNG encoding)
- Status: Core complete (polishing)

---

## QUICK REF
| Task | Command |
|------|---------|
| Install/link workspace | `bun install` |
| Build all | `bun run build` |
| Build pkg | `cd packages/<pkg> && bun run build` |
| Lint | `bun run lint` |
| Lint fix | `bun run lint:fix` |
| Test pkg | `cd packages/<pkg> && bun test` |
| Changeset | `bun run changeset` |
| UI dev | `cd packages/ui && bun run dev` |
| Regen UI icons | `cd packages/ui && bun run generate-icons` |

## KNOWN GOTCHAS
1. `bun install` REQUIRED on fresh clone; without it `@fossiq/*` workspace packages resolve to stale npm cache versions instead of local src
2. `lezer-grammar-generator/dist/index.js` is what bun actually runs (not src/); if src changes don't take effect, check if dist needs rebuild or edit dist directly
3. lezer-generator CLI errors on `@digit` — use `$[0-9]` in grammar tokens
4. `seq(kw("a"), kw("b"))` in StringOp rule → operator string includes whitespace between words; use `.replace(/\s+/g, " ").trim()` for comparison
5. DuckDB WASM files (`duckdb-eh.wasm`, `duckdb-browser-eh.worker.js`) must stay in `packages/ui/public/`; large files, don't accidentally delete
6. Template (Eta.js): whitespace-significant; use `<%- %>` trim tags; cache compiled templates at module init
