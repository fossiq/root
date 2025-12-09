# General Development Guidelines

## IMPORTANT: System Changes

- **NEVER install global tools** (brew install, npm install -g, etc.) without explicit user approval
- **NEVER start Docker containers** without explicit user approval
- **NEVER modify system configuration** outside the project directory
- Always ask first if a task requires system-level changes

## Communication

- Conversational but professional
- Use markdown with code blocks: `path/to/file.ts#L1-10`
- Don't apologize excessively - just proceed
- **Keep responses VERY short** - minimize redundant explanations
- User sees all actions, no need to repeat what was done
- **CRITICAL: No large summaries after each turn** - do NOT recap what was done or provide summary sections. Only provide status updates if asked. Use single sentence or short bullet points at most
- **Only run tests if you modified source files** - don't re-run to confirm unchanged code

## Code Style

- TypeScript with ESM (import/export)
- Functional programming over classes
- Pure functions for transformations
- Small, focused functions (single responsibility)
- Descriptive names
- **Use Bun as runtime** - Bun's `$` for shell commands, not Node's child_process
- **Always use `bunx` instead of `npx`** and **`bun run` instead of `npm run`**
- **DO NOT generate boilerplate/examples unless explicitly asked**

## Architecture

- Monorepo with workspaces in `packages/`
- Clear package boundaries
- Separate concerns (grammar, types, builders, etc.)
- Handle errors with descriptive messages
- Don't add features until requested

## Code Quality

- ESLint configured at monorepo root (`.eslintrc.json`)
- Run `bun run lint` from root to check all packages
- Run `bun run lint:fix` to auto-fix issues
- Packages can extend root config with their own `.eslintrc.json`
- No need to add ESLint deps per-package (hoisted from root)

## File Organization

- Files under ~100-150 lines
- Group by domain/feature, not type
- Use folders with index.ts for re-exports
- One clear responsibility per file

## Development Workflow

- Build incrementally
- Focus on correctness over completeness
- Test simple cases first
- 1-2 fix attempts, then defer to user
- Never simplify code just to solve issues

## Testing

- **Default: NO TESTING during development**
- Test after feature completion
- Use Bun test runner when needed
- For kql-parser: `bun test tests`
- Test files must be in `tests/` directories, never in `src/`

## Documentation

- **NEVER create standalone setup/explanation files** (e.g., `.eslint-setup.md`, `SETUP.md`, `HOW-TO.md`)
- Configuration should be self-explanatory through comments
- README files should be minimal and high-level only
- Code and configs are the documentation
