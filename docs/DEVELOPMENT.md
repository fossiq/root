# Development Guide

**Last Updated:** 2026-01-19

## Quick Reference

```bash
# Install
bun install

# Build all packages
bun run build

# Lint
bun run lint
bun run lint:fix

# Test (package-specific)
cd packages/<package> && bun run test

# Run UI dev server
cd packages/ui && bun run dev

# Create changeset
bun run changeset

# Version packages
bun run version

# Publish all (automated CI)
bun run release

# Manual release (when CI fails)
export NPM_TOKEN=<token>
export GITHUB_TOKEN=<token>
bun scripts/release-all.ts
```

## Development Workflow

### 1. Setup

```bash
git clone <repo>
cd root
bun install
```

**Requirements:**
- Bun v1.3.4+ ([bun.sh](https://bun.sh))
- Git
- Modern browser (Chrome 86+, Edge 86+)

### 2. Making Changes

**Critical Rules (from AGENTS.md):**
- ⚠️ **NEVER auto-commit** - always ask user approval first
- ⚠️ **ALWAYS fetch/pull main** before creating new branch
- ⚠️ **NEVER suppress issues** - ask user what to do

**Workflow:**
1. Fetch latest: `git fetch origin && git pull origin main`
2. Create branch: `git checkout -b <branch-name>`
3. Make changes
4. Test locally
5. Create changeset: `bun run changeset`
6. Commit with approval
7. Push: `git push -u origin <branch-name>`
8. Create PR via `gh pr create`

### 3. Testing Strategy

**Default:** NO testing during development
- Test AFTER feature completion
- Only run tests if you modified source files
- Test files in `tests/` directories, never in `src/`

**Per-Package:**
```bash
# kql-lezer (currently failing - dep issues)
cd packages/kql-lezer && bun run test

# kql-to-duckdb (113 tests)
cd packages/kql-to-duckdb && bun run test tests

# ui (manual testing)
cd packages/ui && bun run dev
```

### 4. Documentation Updates

**After ANY feature:**
1. Update feature checklists (mark [x] for completed)
2. Add patterns/gotchas to dev guides
3. Update status docs

**Why:** AI agents have no memory between sessions. Without updates, knowledge is lost.

## Package-Specific Workflows

### kql-lezer Development

**When to Modify:**
- Adding new KQL operator support
- Fixing parsing edge cases
- Improving AST structure

**Process:**
1. Update `src/kql.grammar` (Lezer grammar)
2. Run `bun run build:grammar` (regenerates parser.ts)
3. Update `src/parser/cst-to-ast/` mappers if needed
4. Update types in `src/types.ts`
5. Run tests (when dep issue fixed)
6. Update docs

**Key Files:**
- `src/kql.grammar` - Hand-written grammar (THIS is the source of truth)
- `src/parser.ts` - Generated (DO NOT EDIT manually)
- `src/parser/cst-to-ast/index.ts` - Main mapper

**Grammar Debugging:**
See `packages/kql-lezer/docs/howto-grammar-debug.md`

### kql-to-duckdb Development

**When to Modify:**
- Adding support for new operators
- Adding function mappings
- Fixing SQL generation bugs

**Process:**
1. Import types from kql-lezer if needed
2. Update `src/translator.ts`
3. Add function mapping if needed
4. Add test cases in `tests/`
5. Run `bun run test tests`
6. Update status docs

**Key Patterns:**
```typescript
// Adding new operator
function translateOperator(op: OperatorType): string {
  const column = translateExpression(op.column)
  return `SELECT ${column} FROM ...`
}

// Adding new function
const functionMap = {
  kqlName: 'SQL_NAME',
  // ...
}
```

### ui Development

**When to Modify:**
- UI/UX improvements
- Adding query features
- Fixing layout issues

**Process:**
1. Start dev server: `bun run dev`
2. Make changes in `src/`
3. Test in browser
4. Update styles in `src/styles/theme.css`
5. Document gotchas in `docs/ui-dev.md`

**Hot Module Replacement:** Vite auto-reloads on changes

## Common Tasks

### Adding a New KQL Operator

1. **kql-lezer:** Add grammar rule in `src/kql.grammar`
2. **kql-lezer:** Add CST→AST mapper in `src/parser/cst-to-ast/operators/`
3. **kql-lezer:** Add type definition
4. **kql-to-duckdb:** Add translator in `src/translator.ts`
5. **kql-to-duckdb:** Add tests
6. **Both:** Update status docs

### Fixing a Build Issue

1. Check TypeScript errors: `bun run build`
2. Check lint errors: `bun run lint`
3. Fix issues
4. Verify: `bun run build && bun run lint`

### Creating a Pull Request

**Required by AGENTS.md:**
1. Run git status, git diff, git log in parallel
2. Analyze all changes (NOT just latest commit)
3. Draft PR summary covering ALL commits
4. Push with `-u` flag if new branch
5. Use `gh pr create` with HEREDOC for body:

```bash
gh pr create --title "Title" --body "$(cat <<'EOF'
## Summary
- Bullet points of changes

## Test plan
- Checklist for testing
EOF
)"
```

6. **MUST include disclaimer:** `_This PR was created by an AI agent on behalf of @<username>._`

## Gotchas & Lessons Learned

### General

1. **Use Bun, not npm:** All scripts use `bun run`, not `npm run`
2. **Workspace dependencies:** Use `workspace:*` for internal packages
3. **ESM only:** All packages use `"type": "module"`
4. **Read before edit:** Always read files before modifying
5. **Minimize output:** Use `head`, `tail`, `grep` to limit bash output

### kql-lezer

1. **Generated files:** parser.ts is auto-generated, don't edit directly
2. **Grammar syntax:** Lezer uses `{ }` for alternation, not tree-sitter's `choice()`
3. **CST nodes:** Lezer CST uses `.node` property, not `.children`
4. **Test deps:** @lezer/lr resolution issue - tests currently failing

### kql-to-duckdb

1. **CTE naming:** Use `cte_0`, `cte_1`, etc. for deterministic output
2. **Expression parentheses:** Always parenthesize sub-expressions to maintain precedence
3. **Function mapping:** Case-sensitive - `count()` ≠ `COUNT()`
4. **Let variables:** Substitute before translation, not during

### ui (SolidJS)

1. **No hooks:** SolidJS uses `createSignal`, not `useState`
2. **Reactivity:** Wrap derived data in `createMemo`, not regular functions
3. **Grid truncation:** MUST use `min-width: 0` on grid children
4. **Theme switching:** Update DOM classes, not just CSS
5. **DuckDB files:** Must be in `public/`, not bundled by Vite
6. **File handles:** Lost on page reload without user permission

## Troubleshooting

### Tests Failing

**kql-lezer:**
- Issue: Cannot find @lezer/lr
- Workaround: None currently - known issue

**kql-to-duckdb:**
- Issue: "0 test files matching pattern"
- Fix: Ensure test files have `.test.ts` or `.spec.ts` suffix
- Run: `bun test tests` (not just `bun test`)

### Build Errors

**TypeScript errors:**
- Check imports from workspace packages
- Verify `tsconfig.json` references
- Run `bun run build` from root to build in order

**Lezer grammar errors:**
- Check grammar syntax in `kql.grammar`
- Run `bun run build:grammar` to see parser generation errors
- See `docs/howto-grammar-debug.md`

### UI Not Loading

**DuckDB errors:**
- Check `public/duckdb-eh.wasm` exists
- Check browser console for WASM errors
- Verify DuckDB WASM version compatibility

**CodeMirror errors:**
- Check kql-lezer build output
- Verify @codemirror packages installed
- Check browser console for module errors

## Git Workflow

### Branch Naming

- Feature: `feat/<description>`
- Fix: `fix/<description>`
- Agent work: `claude/<description>-<session-id>`

### Commit Messages

```
feat(package): short description

Longer description if needed.
Explains why, not what.
```

**Examples:**
- `feat(kql-lezer): add support for between operator`
- `fix(ui): prevent grid column overflow with long text`
- `docs: update kql-to-duckdb status with test count`

### GitHub CLI Usage

**Always use `gh` for GitHub operations:**
```bash
# Create issue
gh issue create --title "Title" --body "Body" --label "bug,agent"

# Create PR
gh pr create --title "Title" --body "$(cat <<'EOF'
Body here
EOF
)"

# View workflow
gh run view <run-id>

# Check logs
gh run view --log-failed --job=<job-id>
```

**MUST include disclaimer on ALL GitHub content:**
```markdown
---
_This {issue|PR|comment} was created by an AI agent on behalf of @<username>._
```

## Monorepo Management

### Turborepo

**Build order:** Automatically handled by turbo
**Caching:** Turbo caches build outputs
**Filtering:** Use `--filter` to target specific packages

```bash
# Build only ui and its dependencies
bun run build --filter=./packages/ui
```

### Changesets

**Creating a changeset:**
```bash
bun run changeset
# Follow prompts:
# 1. Select packages that changed
# 2. Choose version bump (patch/minor/major)
# 3. Write summary
```

**Versioning:**
```bash
# Update package versions
bun run version

# Publish to npm
bun run release
```

**Fixed mode:** All packages version together (currently all at 1.2.0)

### Manual Release Process

The automated changesets workflow may not always work. Use these manual scripts when needed:

**Prerequisites:**
```bash
# Set required tokens
export NPM_TOKEN=<your-npm-token>
export GITHUB_TOKEN=<your-github-token>

# Version packages first
bun run version
```

**Individual steps:**
```bash
# 1. Publish to npm only
bun scripts/publish-npm.ts

# 2. Publish to GitHub Package Registry only
bun scripts/publish-github.ts

# 3. Create GitHub release only
bun scripts/create-release.ts

# 4. Deploy UI only
bun scripts/deploy-ui.ts
```

**Complete release (all steps):**
```bash
# Runs: build → npm publish → GitHub publish → create release → deploy UI
bun scripts/release-all.ts
```

**Scripts location:** `/scripts/`
- `publish-npm.ts` - Publish all packages to npm
- `publish-github.ts` - Publish all packages to GitHub registry
- `create-release.ts` - Create GitHub release from version
- `deploy-ui.ts` - Deploy UI to fossiq.github.io
- `release-all.ts` - Run complete release workflow

**Notes:**
- UI deployment requires either SSH key or GITHUB_TOKEN
- All packages must be built before publishing
- Versions should be bumped via changesets before running scripts

## Code Style

### TypeScript

- **Functions:** Small, focused, single responsibility
- **Naming:** Descriptive (no single letters except loop indices)
- **Files:** Under ~100-150 lines
- **Errors:** Handle with descriptive messages
- **Pure functions:** Prefer over classes

### Imports

```typescript
// External first
import { something } from 'external-package'

// Internal workspace
import { Type } from '@fossiq/kql-ast'

// Relative
import { helper } from './helpers'
```

### Comments

- Only where logic isn't self-evident
- Explain WHY, not WHAT
- Update when code changes

## CI/CD

### GitHub Actions

**Workflows:**
- `ci.yml` - Lint, build, test on push/PR
- `publish.yml` - Publish to npm on changeset merge

**Debugging CI:**
1. `gh run view <run-id>` - See job status
2. `gh run view --log-failed --job=<job-id>` - See failed logs
3. Check workflow definitions in `.github/workflows/`
4. Inspect job files in `.github/workflows/jobs/`

**Common CI Failures:**
- Dependency installation (check lock file)
- Cache issues (update cache keys)
- Build order (check turbo.json)

## Performance Tips

### Development

- Use `bun run dev` in ui for hot reload
- Use `--filter` to build only changed packages
- Use lint fix: `bun run lint:fix` vs manual fixes

### Production

- All packages pre-built for npm
- UI uses Vite's optimized build
- DuckDB WASM lazy-loaded
- Table virtualization for large results

## Resources

- **Bun:** https://bun.sh/docs
- **Lezer:** https://lezer.codemirror.net/
- **SolidJS:** https://www.solidjs.com/docs
- **DuckDB WASM:** https://duckdb.org/docs/api/wasm
- **CodeMirror 6:** https://codemirror.net/docs/
- **Changesets:** https://github.com/changesets/changesets
