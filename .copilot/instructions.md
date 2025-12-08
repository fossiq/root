# Copilot Instructions

## Meta-Instructions

**After completing ANY feature:**

1. Document the implementation process in relevant `.copilot/` files
2. Update feature checklists (mark [x] for completed)
3. Add patterns/gotchas discovered
4. Update this instruction if you improve the process itself

**Why:** AI agents have no memory between sessions. Without updates, knowledge is lost.

## Project Overview

Expedition monorepo - KQL (Kusto Query Language) tooling with TypeScript and Bun.

## Communication

- Conversational but professional
- Use markdown with code blocks: ```path/to/file.ts#L1-10
- Don't apologize excessively - just proceed
- **Keep responses concise** - minimize redundant explanations
- User sees all actions, no need to repeat what was done

## Code Style

- TypeScript with ESM (import/export)
- Functional programming over classes
- Pure functions for transformations
- Small, focused functions (single responsibility)
- Descriptive names
- **Use Bun as runtime** - Bun's `$` for shell commands, not Node's child_process
- **DO NOT generate boilerplate/examples unless explicitly asked**

## Architecture

- Monorepo with workspaces in `packages/`
- Clear package boundaries
- Separate concerns (grammar, types, builders, etc.)
- Handle errors with descriptive messages
- Don't add features until requested

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
- For kql-parser: `bun run test-grammar`

## Grammar Development (kql-parser)

- Edit source TS in `src/grammar/`, compile with `bun run compile-grammar`
- Never edit `grammar.js` directly
- Run `bun x tree-sitter-cli generate` to verify no conflicts
- See `.copilot/kql-parser/` for detailed guides

## Documentation

- JSDoc for public APIs only
- Keep READMEs minimal and high-level
- **NEVER write granular documentation** (test structure explanations, function listings, step-by-step guides)
- Code should be self-explanatory - if it needs detailed docs, it's too complex
- Update `.copilot/` files as you work with implementation notes only
