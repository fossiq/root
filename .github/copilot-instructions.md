# Copilot Instructions

## Meta-Instructions

**After completing ANY feature:**

1. Document the implementation process in [KQL Parser Status](instructions/kql-parser-status.md) (if relevant) or the appropriate instruction file.
2. Update feature checklists (mark [x] for completed) in [KQL Parser Status](instructions/kql-parser-status.md).
3. Add patterns/gotchas discovered to [KQL Parser Development Guide](instructions/kql-parser-dev.md) or [General Development Guidelines](instructions/meta.md).

**Why:** AI agents have no memory between sessions. Without updates, knowledge is lost.

**NEVER auto-commit** - always prompt user before committing changes.

## Project Overview

Expedition monorepo - KQL (Kusto Query Language) tooling with TypeScript and Bun.

## Documentation Index

Detailed instructions and documentation are split into the following files for better maintainability and readability by AI agents:

- **[General Development Guidelines](instructions/meta.md)**
  - Communication, Code Style, Architecture, Code Quality, File Organization, Workflow, Testing, Documentation.
- **[Monorepo Management](instructions/monorepo.md)**
  - Package Structure, Naming, Dependencies, Build Process, Adding Packages, Exports, ESLint, Versioning, GitHub Workflows.
- **[KQL Parser Development Guide](instructions/kql-parser-dev.md)**
  - Technical guide for `@fossiq/kql-parser`. Structure, Grammar, Builders, How to add operators, etc.
- **[KQL Parser Status & Checklist](instructions/kql-parser-status.md)**
  - Current state, Recent completions, Feature checklist, Publishing readiness.

Please refer to these files for specific details.