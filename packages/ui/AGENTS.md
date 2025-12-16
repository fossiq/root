# @fossiq/ui Agent Guide

## Purpose
- SolidJS + Vite UI that orchestrates the parser (`@fossiq/kql-parser`), Lezer highlighter, translator, and DuckDB WASM. Entirely client-side—focus on fast iteration and Azure Data Explorer parity.

## Structure
```
packages/ui/
├── src/components/*        # Editor, Sidebar, ResultsTable, etc.
├── src/contexts/SchemaContext.tsx
├── src/hooks/useTheme.ts
├── src/styles/*.css/ts
├── src/utils/* (completion, file persistence)
├── public/* (DuckDB workers/WASM, tree-sitter artifacts)
├── vite.config.ts / index.html
└── package.json
```

## Commands
- Install workspace deps: `bun install` (root).
- Dev server: `bun run dev` (Vite, port 5173).
- Production build: `bun run build` (tsc + Vite).
- Preview: `bun run preview`.
- Tests currently placeholder; add via Vitest when asked.

## Development Notes
- Keep components <150 lines; compose rather than grow mega files.
- Editor stack lives in `src/components/Editor.tsx` + `src/utils` (completion/linter). Ensure KQL extensions from `@fossiq/kql-lezer` load with CodeMirror.
- DuckDB flow + file persistence handled in `SchemaContext` and `fileHandleStore` (IndexedDB). Maintain clear separation between UI rendering, data access, and translator integration.

## Style & Accessibility
- SolidJS idioms only (`createSignal`, `createMemo`, `<For>`, `<Show>`). No React hooks.
- Semantic HTML + WAI-ARIA. See `packages/ui/docs/ui-dev.md` for the full checklist.
- Theme management: toggle `theme-light`/`theme-dark` on `document.documentElement`, respect stored preference before reacting to system changes.
- Grid/table layouts must use `min-width: 0` inside flex/grid containers to keep virtualization stable.

## Assets & WASM
- DuckDB WASM + workers stay in `public/`; never bundle them. Same for `tree-sitter.wasm` + `tree-sitter-kql.wasm`. Ensure COOP/COEP headers remain configured in Vite.

## Status (2025-12-09)
- Phase 7 (Functionality & Integration) polishing. Recent fixes: theme toggle persistence, results grid overflow, syntax highlighting integration via `@fossiq/kql-lezer`.
- Outstanding: improve syntax highlighting contrast. Track details in `packages/ui/docs/ui-status.md`.

## Documentation & Coordination
- After meaningful UI changes, update `packages/ui/docs/ui-dev.md` (implementation guide) and `packages/ui/docs/ui-status.md` (progress checklist) with new gotchas.
- Keep dependency versions aligned with parser/translator packages; update imports immediately when AST/translator APIs change.
- Document any new workspace scripts/env assumptions here and in root `AGENTS.md`.

