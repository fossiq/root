# AI Agent Instructions for Fossiq

This document contains all instructions for AI agents working on the Fossiq codebase. Instructions are organized by priority level.

---

## CRITICAL: System & Safety Rules

**These rules MUST be followed at all times:**

- **NEVER install global tools** (`brew install`, `npm install -g`, etc.) without explicit user approval
- **NEVER start Docker containers** without explicit user approval
- **NEVER modify system configuration** outside the project directory
- **⚠️ NEVER AUTO-COMMIT WITHOUT EXPLICIT USER APPROVAL ⚠️**
  - EVERY SINGLE TIME you use `git commit`, you MUST FIRST ask the user for approval
  - Use this exact pattern: "Should I commit these changes with message: [message]?"
  - WAIT for explicit user response before running `git commit`
  - The ONLY exception is if the user says at the START of the session "you can auto-commit from now on"
  - If you forget to ask, that is a CRITICAL FAILURE
  - NEVER assume approval. NEVER commit "just because the changes look good"
  - Every instance of skipping this step is a serious violation
- **Do not patch things** - always ask before proceeding and wait for explicit approval
- **NEVER suppress, hide, or take action to eliminate issues** - EXTREMELY DISCOURAGED. Do not suppress warnings, ignore errors, or take any action whose sole purpose is to make issues disappear or go off visibility. Always ask the user what to do instead. Examples of violations:
  - Suppressing build warnings without user approval
  - Deleting error logs
  - Modifying config to hide problems
  - Wrapping errors in try-catch to silence them
  - Any action taken "just to pass checks" or "just to make the tests pass"
  - **If you catch yourself about to do this, STOP and ask the user first**

---

## HIGH: Communication & Output

- Keep responses **VERY short** - minimize redundant explanations
- **No large summaries** after each turn - only provide status updates if asked
- User sees all actions, no need to repeat what was done
- Don't apologize excessively - just proceed
- Use markdown with code blocks: `path/to/file.ts#L1-10`

---

## HIGH: Code Style & Architecture

### Runtime & Tools

- **Use Bun as runtime** - `bunx` instead of `npx`, `bun run` instead of `npm run`
- TypeScript with ESM (import/export)
- Functional programming over classes
- Pure functions for transformations

### Code Quality

- Small, focused functions (single responsibility)
- Descriptive names
- Files under ~100-150 lines
- Handle errors with descriptive messages
- ESLint configured at root - run `bun run lint` to check

### Architecture

- Monorepo with workspaces in `packages/`
- Clear package boundaries
- Separate concerns (grammar, types, builders, etc.)
- Don't add features until requested

---

## HIGH: Development Workflow

### GitHub Interactions

- **Always use `gh` CLI** for all GitHub interactions (issues, PRs, workflows, logs, etc.).
- **Include Disclaimer:** When creating issues or comments via `gh` CLI, **ALWAYS** include the disclaimer at the bottom:
  ```markdown
  ---

  _This {issue|comment} was created by an AI agent on behalf of @<username>._
  ```
- Do not use direct API tools if `gh` CLI can perform the task.
- To fetch workflow logs: `gh run view <run-id> --log` or `gh run view --job=<job-id> --log`
- Do NOT use WebFetch for GitHub Actions pages

### MCP Tools

- **Use context7 MCP** for fetching library/framework documentation when needed

### Before Making Changes

- **Always read files before editing** - understand existing code first
- Use Google/WebFetch for facts before making changes, not after
- 1-2 fix attempts, then defer to user
- Never simplify code just to solve issues

### Testing

- **Default: NO TESTING during development** - test after feature completion
- Only run tests if you modified source files
- Test files in `tests/` directories, never in `src/`
- Use Bun test runner: `bun test tests`

### Documentation Updates (After ANY feature)

1. Update feature checklists (mark [x] for completed) in relevant status files
2. Add patterns/gotchas discovered to dev guides
3. **Why:** AI agents have no memory between sessions. Without updates, knowledge is lost.

---

## MEDIUM: Tool Usage Optimization

### Context Optimization

- **Reading Files:** Use `limit` parameter for exploration. Only read full file when editing.
- **Shell Output:** Pipe large outputs to `head -n 20`, `tail`, `grep`, or file redirection
- Minimize output tokens without losing clarity

### File Operations

- **NEVER create standalone setup/explanation files** (e.g., `.eslint-setup.md`, `SETUP.md`)
- Configuration should be self-explanatory through comments
- README files should be minimal and high-level only
- **Do NOT generate boilerplate/examples unless explicitly asked**

---

## Package-Specific Guides

### @fossiq/kql-parser (Tree-sitter KQL Parser)

**Structure:**

```
packages/kql-parser/
├── src/grammar/     # TypeScript grammar (compiled to JS)
├── src/builders/    # AST builders (tree-sitter -> typed AST)
├── src/types.ts     # AST type definitions
├── scripts/         # Build scripts
└── prebuilds/       # Pre-built native bindings
```

**Build Flow:**

```
Edit src/grammar/rules.ts
  → bun run compile-grammar → grammar.js
  → bun x tree-sitter-cli generate → C parser
  → bun run build → TypeScript compilation
  → bun run test-grammar → validate
```

**Adding a New Operator:**

1. Define types in `src/types.ts`
2. Add grammar rules in `src/grammar/rules.ts`
3. Register rules in `src/grammar/index.ts`
4. Create builders in `src/builders/operators.ts`
5. Wire up in `src/builders/index.ts`
6. Add tests in `scripts/test-grammar.ts`
7. Compile & test: `bun run compile-grammar && bun x tree-sitter-cli generate && bun run test-grammar`

**Key Patterns:**

- Wrapper nodes (tree-sitter 0.25+): Handle `operator`, `expression`, `literal` wrappers
- Lists with separators: Skip `,` nodes when iterating
- Assignment detection: Check for `=` in children

**Status:** 88 tests passing, production-ready. All major KQL features implemented.

---

### @fossiq/kql-to-duckdb (KQL to SQL Translator)

**Structure:**

```
packages/kql-to-duckdb/
├── src/translator.ts   # Core translation logic
├── src/types.ts        # Type definitions
└── tests/              # Test suite
```

**Translation Strategy:** CTE Pipeline

```kql
Table | where Col > 10 | project Col
```

Becomes:

```sql
WITH cte_0 AS (SELECT * FROM Table WHERE Col > 10),
     cte_1 AS (SELECT Col FROM cte_0)
SELECT * FROM cte_1
```

**Adding Support for New Operator:**

1. Add case in `translatePipe` switch
2. Implement handler function
3. Add tests in `tests/index.test.ts`

**Supported:** 11 operators (where, project, extend, summarize, sort, distinct, take/limit, top, union, mv-expand, search), 8 join types, 35+ functions

**Not Supported:** `parse` operator (dynamic schema incompatible with SQL)

**Status:** 113 tests passing, production-ready.

---

### @fossiq/kql-lezer (Lezer Parser for CodeMirror)

**Purpose:** Real-time KQL syntax highlighting in editors (no WASM needed)

**Structure:**

```
packages/kql-lezer/
├── src/kql.grammar    # Lezer grammar definition
├── src/parser.ts      # Generated (auto-generated, @ts-nocheck)
└── src/index.ts       # Language support & exports
```

**Build:** `lezer-generator src/kql.grammar -o src/parser.ts`

**Status:** 77 tests passing, Phase 4 (CodeMirror integration) complete.

---

### @fossiq/kql-ast (Shared AST Types)

**Purpose:** Language-agnostic AST types for multiple parser implementations

Provides: `ASTNode`, `KQLDocument`, `ParseResult`, `HighlightToken`, `TokenType`

**Status:** Core types complete, build/testing pending.

---

### @fossiq/ui (Web Application)

**Tech Stack:** SolidJS, Vite, PicoCSS, CodeMirror 6, DuckDB WASM, TanStack Table

**Structure:**

```
packages/ui/
├── src/components/    # SolidJS components
├── src/contexts/      # SchemaContext (DuckDB connection)
├── src/hooks/         # useTheme, etc.
├── src/styles/        # CSS
└── public/            # WASM files, manifest
```

**Key Implementation Details:**

- DuckDB WASM requires `duckdb-eh.wasm` and worker in `public/`
- File persistence via IndexedDB + File System Access API
- Theme toggle: Must update DOM classes (`theme-light`/`theme-dark`) for CSS to respond
- Results table: CSS Grid with `min-width: 0` for text truncation

**Gotchas:**

- SolidJS: No hooks, use `createSignal`/`createMemo`
- Grid text truncation needs `min-width: 0` on grid children
- Virtual rows need both `left: 0` and `right: 0`

**Status:** Phase 7 (Polishing) - core functionality complete.

---

## Monorepo Management

### Architecture Tasks (In Progress)

The following architectural changes are being implemented to fix publish/versioning issues:

- [x] **Task 1: Add Turborepo** - Use turborepo for running commands in dependency order
- [x] **Task 2: Unified Versioning** - Sync all packages to version `1.1.0`
- [x] **Task 3: Configure Changesets** - Set up `fixed` mode so all packages version together; handle changelog entries for unchanged packages
- [x] **Task 4: Add ci:publish scripts** - Add `ci:publish` script to all publishable packages (not ui) that runs `bunx npm@latest publish --ignore-scripts --provenance`
- [x] **Task 5: Fix WASM Build** - Use WASI SDK in CI (auto-downloads, no Docker needed) via `tree-sitter build --wasm`

**Decisions made:**

- Target version: `1.1.0` for all packages
- WASM strategy: Build in CI using WASI SDK (no binary committed to repo)

**Current package versions:**

- `@fossiq/kql-ast`: 0.2.1
- `@fossiq/kql-lezer`: 0.2.1
- `@fossiq/kql-parser`: 1.0.3
- `@fossiq/kql-to-duckdb`: 0.2.2
- `@fossiq/ui`: 0.2.1

### Package Naming

- Use `@fossiq/` prefix
- Use kebab-case

### Dependencies

- Use `workspace:*` for internal packages
- Keep external dependencies minimal
- Pin dev dependency versions

### Adding New Packages

1. Create `packages/<package-name>/`
2. Create `package.json` with proper structure
3. Copy `tsconfig.json` from existing package
4. Create minimal `src/index.ts`

### Versioning (Changesets)

```bash
bun run changeset     # Create changeset after changes
bun run version       # Bump versions (manual)
bun run release       # Publish to npm (manual)
```

GitHub Actions handles automated releases when changesets are merged to `main`.

### GitHub Workflows

- Prefer existing GitHub Actions over custom scripts
- Scripts go in `.github/scripts/`
- Never use inline shell code in workflow files

### Creating GitHub Issues

When creating issues via `gh` CLI:

- **Always add the `agent` label** to indicate it was created by an AI agent
- **Get the current username** first: `gh api user -q .login`
- **Include a disclaimer** at the end of the issue body:
  ```
  ---
  *This issue was created by an AI agent on behalf of @<username>.*
  ```
- Use appropriate package labels (e.g., `ui`, `bug`, `enhancement`)
- Use clear title prefixes: `[ui]`, `[ci]`, `[kql-parser]`, etc.

---

## Quick Reference

| Task             | Command                             |
| ---------------- | ----------------------------------- |
| Install deps     | `bun install`                       |
| Build all        | `bun run build`                     |
| Lint             | `bun run lint`                      |
| Lint fix         | `bun run lint:fix`                  |
| Test package     | `cd packages/<pkg> && bun run test` |
| Create changeset | `bun run changeset`                 |
| Start UI dev     | `cd packages/ui && bun run dev`     |

---

## Agent Shortcuts

### #issue <description>

**Trigger:** User starts prompt with `#issue`.

**Protocol:**
1.  **Analyze:** Perform preliminary analysis of the reported bug based on the description.
2.  **Create Issue:** Use `gh` CLI to create an issue.
    -   **Title:** Concise summary derived from description.
    -   **Body:** Full description + Analysis + [Standard Disclaimer](#github-interactions).
    -   **Labels:** `bug`, `agent`.
3.  **Confirm:** Report the issue URL and ask: "Should I proceed with fixing this?"
4.  **Execute (if confirmed):**
    -   Create branch `fix/issue-<id>`.
    -   Implement fix.
    -   Open PR with `gh pr create`.
