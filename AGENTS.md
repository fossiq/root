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
- **⚠️ ALWAYS FETCH AND PULL MAIN BEFORE CREATING A NEW BRANCH ⚠️**
  - EVERY TIME you create a feature/fix branch, you MUST FIRST run: `git fetch origin && git pull origin main`
  - This prevents conflicts from concurrent changes to main
  - If you skip this step and conflicts arise during rebase, you will waste time resolving them
  - This is a CRITICAL FAILURE if ignored
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

- **Use Bun as runtime** - `bun x` instead of `npx`, `bun run` instead of `npm run`
- TypeScript with ESM (import/export)
- Functional programming over classes
- Pure functions for transformations
- **Use `$` commands for single-line operations** - When writing scripts that run in the Bun runtime, use the `$` commands to achieve something unless the command gets longer than one line
- **Move conditionals to TypeScript** - When using `$` commands, avoid bash conditionals (if statements) in one-liners and instead handle the logic in TypeScript code before executing the command

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

## HIGH: Debugging Context & Efficiency

When providing context for debugging sessions or issue fixes, include these details to minimize exploratory operations:

### Pre-Session Context to Provide

- **Current file paths and structure** - If you know which files are involved, specify exact paths (e.g., `packages/kql-parser/src/grammar/rules.ts`)
- **Git status** - If changes are already staged/committed, mention the branch name and commit SHAs
- **Test results** - Provide test output (pass/fail counts) so we don't re-run unchanged tests
- **Error messages** - Full error output, not summaries (includes stack traces, line numbers, variable states)
- **Dependencies between changes** - If fix A requires fix B first, say so explicitly
- **File relationships** - Which files import/depend on each other (especially in monorepos)
- **Build artifacts status** - If generated files (grammar.js, parser.c) are stale or up-to-date

### What NOT to Make Us Discover

- Repository structure (provide explicit paths)
- Available git branches (list them)
- Which tests exist (mention test counts and file locations)
- Package dependencies and versions (share package.json extracts)
- Label availability (list valid labels if creating issues)
- Build order or command sequences (specify exact build steps needed)

### Example Good Context

```
I'm working on the between operator in kql-parser.
- Changes needed in: packages/kql-parser/src/grammar/rules.ts (line 261-263)
- Also affects: packages/kql-to-duckdb/src/translator.ts
- Tests to verify: packages/kql-parser/bun.test.ts (88 tests), packages/kql-to-duckdb/tests/index.test.ts (114 tests)
- Current branch: main, no uncommitted changes
- Valid labels for issues: enhancement, agent, ui (not kql-parser)
```

### Why This Matters

Each exploratory operation (`git status`, `list_directory`, `grep`, `gh label list`) consumes tokens and time. Pre-provided context lets me jump straight to implementing fixes instead of discovering file structures, test counts, or available options.

---

## HIGH: Development Workflow

### GitHub Interactions

- **Always use `gh` CLI** for all GitHub interactions (issues, PRs, workflows, logs, etc.).
- **⚠️ MANDATORY DISCLAIMER ON ALL GITHUB CONTENT ⚠️**

  - **THIS IS A CRITICAL RULE - VIOLATIONS ARE SERIOUS FAILURES**
  - When creating issues, PRs, or comments via `gh` CLI, you **MUST ALWAYS** include the disclaimer at the bottom
  - **NEVER forget this step. NEVER skip it. Check EVERY time before submitting.**
  - First, get the username: `gh api user -q .login`
  - Then include this exact format at the end of the body:

    ```markdown
    ---

    _This {issue|PR|comment} was created by an AI agent on behalf of @<username>._
    ```

  - If you forget to add the disclaimer, that is a **CRITICAL FAILURE** equivalent to auto-committing without approval
  - **Before running `gh issue create`, `gh pr create`, or `gh issue comment`: STOP and verify the disclaimer is included**

- Do not use direct API tools if `gh` CLI can perform the task.
- To fetch workflow logs: `gh run view <run-id> --log` or `gh run view --job=<job-id> --log`
- Do NOT use WebFetch for GitHub Actions pages

### GitHub Actions Debugging

When debugging GitHub Actions failures, follow this systematic approach:

1. **Identify the failing job:**

   ```bash
   gh run view <run-id>
   ```

2. **View job details:**

   ```bash
   gh run view <run-id> --job=<job-id>
   ```

3. **Examine failed logs:**

   ```bash
   gh run view --log-failed --job=<job-id>
   ```

4. **Check workflow definitions:**

   ```bash
   gh workflow view <workflow-name> --yaml
   ```

5. **Inspect repository files:**

   ```bash
   gh api repos/<owner>/<repo>/contents/<path> --jq '.content' | base64 -d
   ```

6. **Common failure points and solutions:**
   - **Dependency installation failures:** Check lock files, cache keys, and dependency compatibility
   - **Cache issues:** Update cache keys or clear GitHub Actions cache
   - **Environment mismatches:** Verify runner OS and tool versions match local development
   - **Path/reference errors:** Check file paths and branch references in workflow files

### Example Debugging Process: CI Dependency Installation Failure

When debugging a CI failure where dependencies failed to install:

1. **Identify the failing job and step:**

   ```bash
   gh run view 20279398821
   ```

   This showed the "lint / Lint Source" job failed at "Setup Bun & Dependencies" step.

2. **Examine workflow structure:**

   ```bash
   gh workflow view CI --yaml
   gh api repos/fossiq/root/contents/.github/workflows/jobs/lint.yml --jq '.content' | base64 -d
   ```

   This revealed the job uses a composite action at `./.github/actions/setup-bun`.

3. **Inspect composite action:**

   ```bash
   gh api repos/fossiq/root/contents/.github/actions/setup-bun/action.yml --jq '.content' | base64 -d
   ```

   This showed the action uses caching with a key based on `**/bun.lockb` files.

4. **Check repository files:**

   ```bash
   gh api repos/fossiq/root/contents/ --jq '.[] | select(.name | contains("bun.lock")) | .name'
   ```

   This would reveal if the expected lock file exists.

5. **Solution implementation:**
   - Update references from `bun.lockb` to `bun.lock` in workflow files
   - Add verbose logging to dependency installation scripts
   - Commit changes and verify CI passes

### MCP Tools

- **Use context7 MCP** for fetching library/framework documentation when needed
- **Use webfetch MCP** for retrieving information from GitHub documentation or workflow guides when troubleshooting CI/CD issues

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
- **⚠️ MANDATORY: Include the disclaimer** (see [GitHub Interactions](#github-interactions) - this is a CRITICAL rule)
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
    - **Title:** Concise summary derived from description.
    - **Body:** Full description + Analysis + [Standard Disclaimer](#github-interactions).
    - **Labels:** `bug`, `agent`.
3.  **Confirm:** Report the issue URL and ask: "Should I proceed with fixing this?"

---

### #issue-pr

**Trigger:** User says `#issue-pr` after a fix has been implemented.

**Protocol:**

1.  **Create Branch:** `git checkout -b fix/issue-<id>` (use the issue number from the current context).
2.  **Commit:** Ask for commit approval per [CRITICAL rules](#critical-system--safety-rules), then commit the fix.
3.  **Push:** `git push -u origin fix/issue-<id>`.
4.  **Open PR:** Use `gh pr create` with:
    - **Title:** Reference the issue (e.g., "Fix #<id>: <concise description>").
    - **Body:** Summary of changes + "Closes #<id>" + [Standard Disclaimer](#github-interactions).
    - **Labels:** Appropriate labels (e.g., `bug`, `agent`).
