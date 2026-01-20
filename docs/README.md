# Documentation Index

**Last Updated:** 2026-01-19
**Status:** Verified against codebase

## For AI Agents

This directory contains consolidated, verified documentation optimized for AI agent consumption. All information has been cross-checked against actual code, test files, and package configurations.

### Reading Order

1. **[../AGENTS.md](../AGENTS.md)** ⚠️ **START HERE** - Critical safety rules and instructions
2. **[PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)** - High-level project summary
3. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Technical architecture
4. **[PACKAGES.md](./PACKAGES.md)** - Package-specific details
5. **[DEVELOPMENT.md](./DEVELOPMENT.md)** - Development workflow

### Quick Facts

- **Repository:** fossiq/root (monorepo)
- **Package Manager:** Bun v1.3.4
- **Packages:** 5 (kql-lezer, kql-to-duckdb, kql-ast, ui, lezer-grammar-generator)
- **Current Version:** All at 1.2.0
- **Active Branch:** feat/move-to-lezer-completely
- **Parser Technology:** Lezer (NOT tree-sitter, NOT Chevrotain)

## What's in Each Document

### PROJECT_OVERVIEW.md
- Mission statement
- Current status summary
- Package status table
- KQL feature support
- Known limitations
- Quick start instructions

**Use when:** You need a quick orientation or status check.

### ARCHITECTURE.md
- Design philosophy
- Data flow diagrams
- Package architecture details
- Build system
- Key architectural decisions
- Performance considerations
- Browser compatibility

**Use when:** You need to understand how things work or make architectural decisions.

### PACKAGES.md
- Detailed package documentation
- Public APIs
- Build processes
- Known issues
- Package-specific workflows
- Test status (verified counts)
- Publishing configuration

**Use when:** You're working on a specific package.

### DEVELOPMENT.md
- Development workflow
- Common tasks (step-by-step)
- Gotchas and lessons learned
- Troubleshooting guide
- Git workflow
- CI/CD debugging
- Code style guidelines

**Use when:** You're actively developing or debugging issues.

## Verification Summary

**Verified on:** 2026-01-19

### Documentation Audit Findings

✅ **Accurate:**
- kql-to-duckdb status and features (113 tests confirmed)
- ui status and phase completion
- lezer-grammar-generator feature completeness
- Overall architecture and data flow

⚠️ **Corrected:**
- kql-lezer parser technology (confirmed Lezer, not Chevrotain)
- Test counts consolidated across conflicting sources
- Removed references to non-existent kql-parser package
- Clarified kql-ast as "types defined" not "production ready"

❌ **Known Issues:**
- kql-lezer tests currently failing (missing @lezer/lr dependency)
- kql-to-duckdb test command issues (glob pattern mismatch)
- Some package-level docs still outdated (pending cleanup)

### Source of Truth

**Always check these first:**
1. Actual code in `src/` directories
2. `package.json` files for dependencies and versions
3. Test files for test counts
4. This consolidated documentation
5. Package-specific docs (may be outdated)

## Package-Level Documentation

Package-specific docs still exist in `packages/*/docs/`:

**Keep (accurate):**
- kql-lezer: grammar-reference.md, howto-grammar-debug.md
- kql-to-duckdb: kql-to-duckdb-status.md, kql-to-duckdb-dev.md
- ui: ui-status.md, ui-dev.md
- All AGENTS.md files (package-specific mini-guides)

**Review before use (may be outdated):**
- kql-lezer: COMPLETION_SUMMARY.md, FIX_SUMMARY.md (conflicting test counts)
- kql-lezer: kql_parser_implementation_guide.md (references wrong parser)

## Maintenance

**Update these docs when:**
- Package versions change
- New features are added
- Architecture changes
- New gotchas discovered
- Test counts change

**How to update:**
1. Verify against actual code
2. Update relevant doc(s)
3. Update "Last Updated" date
4. Update verification summary if needed

## Related Documentation

- **../README.md** - User-facing repository README
- **../CONTRIBUTING.md** - Contribution guidelines
- **../FAQ.md** - Common questions and answers
- **../AGENTS.md** - AI agent instructions (CRITICAL)
- **packages/*/README.md** - Package-specific user docs
- **packages/*/AGENTS.md** - Package-specific dev guides
- **packages/*/docs/** - Detailed package documentation

## Feedback

If you find outdated or incorrect information:
1. Verify against actual code
2. Update the relevant doc
3. Add a note in the verification summary
4. Update the "Last Updated" date
