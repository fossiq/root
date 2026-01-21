# AI Agent Instructions for Fossiq

Instructions for AI agents on the Fossiq codebase, organized by priority.

## CRITICAL: System & Safety Rules

**Must be followed without exception:**

- Never install global tools (`brew install`, `npm install -g`, etc.) without explicit user approval.
- Never start Docker containers without explicit user approval.
- Never modify system configuration outside the project directory.
- **Never auto-commit without explicit user approval**:
  - Before every `git commit`, ask: "Should I commit these changes with message: [message]?"
  - Wait for explicit approval.
  - Only exception: User states at session start "you can auto-commit from now on".
  - Skipping this is a critical failure.
- Do not patch issues; always ask for approval first.
- **Always fetch and pull main before new branches**:
  - Run `git fetch origin && git pull origin main` first.
  - Skipping this is a critical failure.
- Never suppress, hide, or eliminate issues (e.g., silence warnings/errors, delete logs, modify configs to hide problems). Always ask user instead.

## HIGH: Communication & Output

- **C4 Rule (Most Important)**: All content creation and thoughts must be Clear, Concise, Correct, Complete, and Confident/Assertive.
- Keep responses very concise; avoid redundancy.
- No large summaries or excessive apologies.
- Use markdown with code blocks, e.g., `path/to/file.ts#L1-10`.

## HIGH: Code Style & Architecture

### Runtime & Tools

- Use Bun: `bun x` (not `npx`), `bun run` (not `npm run`).
- TypeScript ESM; prefer functional programming and pure functions.
- Use `$` for single-line shell operations in scripts; move conditionals to TypeScript.
- Never assume library/spec behavior—always search official docs first (via WebSearch or context7 MCP).

### Code Quality

- Small, single-responsibility functions with descriptive names.
- Keep files <150 lines; split large ones.
- Organize related code in subdirectories.
- Handle errors descriptively.
- Run `bun run lint` to check.
- Avoid 'any' types; use ESLint ignores (@typescript-eslint/no-explicit-any) only when stronger typing is impossible, with explanatory comments.
- No planning terms (e.g., "phase1") in names/comments—use descriptive/feature names.
- Avoid barrel files (index.ts files that re-export everything); import directly from specific modules.

### Template Usage (Eta.js)

- **Whitespace Control**: Eta templates preserve all whitespace, including newlines. Use `<%- %>` to trim whitespace before/after tags for precise output control.
- **Template Loading**: Load and compile templates once at module initialization; cache for performance.
- **Section-Based Rendering**: For complex outputs, split into separate templates per section and join results in TypeScript to maintain control over separators.
- **Error Handling**: Template compilation/rendering errors should be caught and reported descriptively.
- **Separation of Concerns**: Keep logic in TypeScript; use templates only for string formatting and iteration.

### Architecture

- Monorepo with `packages/` workspaces.
- Clear package boundaries; separate concerns.
- Add features only when requested.

## HIGH: Debugging Context & Efficiency

Provide upfront context to minimize exploration:

- Exact file paths and relationships.
- Git status/branch/SHAs.
- Full error messages/stack traces.
- Test results/counts/locations.
- Dependencies between changes.
- Build artifact status.

**Avoid forcing discovery** of repo structure, branches, tests, dependencies, labels, or build steps.

**Example context:**

```
Working on between operator in kql-lezer.
- Files: packages/kql-lezer/src/kql.grammar (L261-263), packages/kql-to-duckdb/src/translator.ts
- Tests: packages/kql-lezer/tests/index.test.ts (88 passing), packages/kql-to-duckdb/tests/index.test.ts (114 passing)
- Branch: main, clean
- Labels: enhancement, agent, ui
```

## HIGH: Development Workflow

### GitHub Interactions

- Use `gh` CLI exclusively.
- **Mandatory disclaimer** on all issues/PRs/comments:
  - Get username: `gh api user -q .login`
  - Append exactly:
    ```
    ---
    _This {issue|PR|comment} was created by an AI agent on behalf of @<username>._
    ```
  - Forgetting this is a critical failure.

### GitHub Actions Debugging

1. `gh run view <run-id>`
2. `gh run view <run-id> --job=<job-id>`
3. `gh run view --log-failed --job=<job-id>`
4. Check workflow YAML and repo files as needed.

### Before Changes

- Always read files first.
- Research facts upfront.
- Limit fix attempts (1-2), then defer to user.

### Testing

- No testing during development; test only after completion if source changed.
- Use `bun test`.

### Documentation (After Any Feature)

- Mark checklists complete.
  Add discovered patterns/gotchas to guides.

## HIGH: MCP Servers

Available MCP (Model Context Protocol) servers for enhanced functionality:

- **vibe-check-mcp**: Use `vibe_check` to analyze code quality, style, or overall "vibe" of code snippets. Useful for code reviews or improvements.
- **taskmanager**: Use `add_tasks_to_request` to break down complex tasks, `approve_request_completion` to track progress. Helps manage multi-step development tasks.
- **sequential-thinking**: Use `sequentialthinking` for step-by-step reasoning and problem-solving. Ideal for debugging or complex logic analysis.
- **basic-memory**: Use `basic-memory_fetch` to retrieve stored information, `create_memory_project` for organizing project-related memories. Provides persistent context across sessions.
- **ESLint**: Use `lint-files` to run ESLint on specific files or directories. Integrates linting directly into workflows.
- **mcp-server-github**: Use for GitHub API interactions, such as fetching issues, PRs, or repository data. Enhances GitHub workflow integration.
- **bun-docs-mcp**: Use `SearchBun` to query Bun runtime documentation. Essential for Bun-specific questions or API lookups.
- **mcp-server-context7**: Use `get-library-docs` to retrieve documentation and code examples for libraries, `resolve-library-id` to find compatible library identifiers. Critical for researching external libraries and APIs.

Always prefer MCP servers over manual searches when available, especially for documentation (context7), linting (ESLint), and task management (taskmanager).

## MEDIUM: Tool Usage

- Limit file reads; pipe large outputs (`head`, `tail`, `rg`).
- Never create standalone setup/explanation files or boilerplate unless asked.

## Package-Specific Guides

### @fossiq/kql-lezer

- Purpose: Real-time KQL highlighting (no WASM).
- Grammar sources: `src/grammar/` (TypeScript files defining tokens, rules, precedence)
- Generated files (DO NOT EDIT): `src/kql.grammar`, `src/parser.ts`, `src/parser.terms.ts`
- Grammar workflow:
  1. Edit TypeScript sources in `src/grammar/` (tokens, rules, plugins)
  2. Run `bun run build` - auto-generates grammar → parser → compiles TS
  3. Update `src/parser/cst-to-ast/` if adding new constructs
  4. Run `bun test` to verify
- Generated files are gitignored - always regenerated on build
- Status: 110 tests passing.

### @fossiq/kql-ast

- Purpose: Shared AST types.
- Status: Core complete.

### @fossiq/ui

- Stack: SolidJS, Vite, PicoCSS, CodeMirror 6, DuckDB WASM, TanStack Table.
- Gotchas: DuckDB files in `public/`; theme via DOM classes; grid truncation needs `min-width: 0`.
- Status: Core complete (polishing).

## Monorepo Management

- Packages: `@fossiq/kebab-case`; internal deps `workspace:*`.
- Adding packages: Create dir, `package.json`, copy `tsconfig.json`, minimal `src/index.ts`.
- Versioning: `bun run changeset`, then `version`/`release`.
- Issues: Add `agent` label; use prefixes (`[ui]`, etc.); include disclaimer.

## Quick Reference

| Task         | Command                         |
| ------------ | ------------------------------- |
| Install deps | `bun install`                   |
| Build all    | `bun run build`                 |
| Lint         | `bun run lint`                  |
| Lint fix     | `bun run lint:fix`              |
| Test package | `cd packages/<pkg> && bun test` |
| Changeset    | `bun run changeset`             |
| UI dev       | `cd packages/ui && bun run dev` |
