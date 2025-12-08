# Copilot Instructions

## Project Overview

This is the Expedition monorepo - a KQL (Kusto Query Language) tooling project.

## Code Style

- Use TypeScript for all new code
- Use ESM module syntax (import/export)
- Prefer functional programming patterns
- Keep functions small and focused
- Use descriptive variable and function names
- VERY IMPORTANT: DO NOT generate example files, boilerplate, or excessive documentation unless asked for explicitly.

## Architecture

- This is a monorepo using workspaces
- Packages are located in `packages/`
- Each package should have clear boundaries and responsibilities

## Testing

- Write tests for new functionality
- Use Bun test runner

## File Organization

- Keep related functionality in separate, focused files
- Avoid large files with multiple responsibilities
- Group by feature/domain rather than by type

## Documentation

- Add JSDoc comments for public APIs
- Keep README files minimal and focused
- Avoid generating excessive documentation
