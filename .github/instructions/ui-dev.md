# @fossiq/ui Development Guide

A modern UI framework for Fossiq, built with SolidJS and designed to mimic Azure Data Explorer's interface for KQL query analysis.

## Tech Stack

- **UI Framework:** SolidJS with TSX support
- **CSS Framework:** PicoCSS with system native fonts, automatic light/dark theme
- **Bundler:** Vite (SolidJS-preferred build tool)
- **Query Results Table:** @tanstack/solid-table@alpha with virtualization
- **Code Editor:** CodeMirror with Kusto language support
- **External Dependencies:** @fossiq/kql\* packages via CDN URLs

## Package Structure

```
packages/ui/
├── src/
│   ├── components/          # SolidJS components
│   │   ├── Editor.tsx       # CodeMirror-based query editor
│   │   ├── Header.tsx       # Main header with logo
│   │   ├── Sidebar.tsx      # Right sidebar with Add Data button
│   │   ├── ResultsTable.tsx # Virtualized table for query results
│   │   ├── Layout.tsx       # Main app layout wrapper
│   │   ├── Icon.tsx         # Icon component for SVG rendering
│   │   └── App.tsx          # Main app structure
│   ├── contexts/
│   │   └── SchemaContext.tsx # Manages DuckDB connection and schema
│   ├── hooks/
│   │   └── useTheme.ts      # System theme detection hook
│   ├── icons/
│   │   └── index.ts         # Icon registry with inline SVG paths
│   ├── styles/
│   │   ├── theme.css        # PicoCSS theme customization with light/dark mode
│   │   └── editorTheme.ts   # CodeMirror theme definitions
│   ├── utils/
│   │   └── completion.ts    # KQL autocomplete logic
│   ├── vite-env.d.ts        # Vite type definitions
│   └── App.tsx              # Main entry point
├── public/
│   ├── duckdb-browser-eh.worker.js # DuckDB worker
│   ├── duckdb-eh.wasm       # DuckDB WASM binary
│   ├── tree-sitter.wasm     # Tree-sitter runtime WASM
│   ├── tree-sitter-kql.wasm # KQL parser WASM
│   ├── manifest.json        # PWA manifest
│   └── sw.js                # Service worker for offline support
├── dist/                     # Build output
├── package.json
├── tsconfig.json
├── vite.config.ts           # Vite configuration with SolidJS plugin
└── index.html               # HTML entry point
```

## Implementation Phases

### Phase 1: Project Setup ✓ (Complete)

- [x] Create documentation (this file)
- [x] Create `packages/ui/` directory structure
- [x] Set up `package.json` with dependencies
- [x] Configure `tsconfig.json` and `vite.config.ts`
- [x] Create basic App.tsx entry point
- [x] Set up PWA with manifest.json and service worker

### Phase 2: Layout & Theming ✓ (Complete)

- [x] Set up PicoCSS with system native fonts
- [x] Implement light/dark theme auto-detection via CSS media query
- [x] Create main Layout component with header, sidebar, editor pane, results pane
- [x] Add main header with Fossiq logo icon
- [x] Create right sidebar (280px) with "Add Data" button spanning full width
- [x] Implement modern design with gradients, glass effects, low contrast styling
- [x] Ensure all components respect system theme preference

### Phase 3: Icon System ✓ (Complete)

- [x] Create inline SVG icon registry in TypeScript (src/icons/index.ts)
- [x] Implement Icon component that renders from registry
- [x] Add logo icon to main header
- [x] Add plus-circle icon to sidebar "Add Data" button
- [x] Remove unused SVG sprite file

### Phase 4: Editor Component ✓ (Complete)

- [x] Integrate CodeMirror 6 with basicSetup
- [x] Create Editor component wrapper
- [x] Add Query header with Run and Clear buttons
- [x] Style editor to match theme (light/dark modes)
- [x] Make active line highlighting subtle (5% opacity)
- [x] Style cursor with proper theme color
- [x] Ensure proper sizing and layout

### Phase 5: Results Table

- [ ] Integrate @tanstack/solid-table
- [ ] Implement virtualized table component
- [ ] Handle dynamic column generation from KQL results
- [ ] Add table styling with PicoCSS
- [ ] Implement sorting and filtering

### Phase 6: Functionality & Integration

- [ ] Connect Run/Clear buttons to editor state
- [ ] Implement Add Data button functionality
- [ ] Handle query execution
- [ ] Display results in table
- [ ] Add error handling and user feedback

### Phase 7: External Dependencies Integration

- [ ] Configure CDN URLs for @fossiq/kql\* packages
- [ ] Create module loading utilities
- [ ] Test loading and using external packages

### Phase 8: Testing & Optimization

- [ ] Add unit tests for components
- [ ] Performance optimization
- [ ] Build configuration finalization

## Semantic HTML & Accessibility

All components must follow WAI-ARIA standards and semantic HTML best practices:

- Use semantic elements: `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`
- Buttons and links must have clear, descriptive text or `aria-label` attributes
- Form inputs must have associated `<label>` elements or `aria-labelledby`
- Color alone must not convey information (must have text/icons)
- Text contrast must meet WCAG AA standards (4.5:1 for normal text, 3:1 for large text)
- Keyboard navigation must be fully functional - all interactive elements must be reachable via Tab
- All interactive elements must have visible focus indicators
- Use `role`, `aria-live`, `aria-describedby`, `aria-hidden` appropriately
- Use `<table>` with `<thead>`, `<tbody>`, `<th>` with `scope` attribute for data tables
- Implement proper heading hierarchy (`<h1>`, then `<h2>`, etc.)
- Use `aria-busy`, `aria-disabled`, `aria-readonly` for dynamic states
- Dialogs/modals must have `role="dialog"` and trap focus
- Provide alt text for images or `aria-hidden="true"` if decorative
- Test with screen readers (NVDA, JAWS, or VoiceOver)

## Behavioral Guidelines

### Assistant Behavior Instructions

- **No Long Summaries:** Provide concise summaries at the end of each turn with only what was changed and next steps
- **Avoid Over-Engineering:** Only make changes that are directly requested or clearly necessary
  - Don't add features, refactor, or make "improvements" beyond what was asked
  - Keep solutions simple and focused
  - Minimal error handling - trust framework guarantees and validate only at system boundaries
  - No premature abstractions - inline code is better than complex utilities
- **Minimal Iterations:** Use Google/WebFetch for facts before making changes, not after
- **Code Quality:**
  - Use semantic HTML and WAI-ARIA standards throughout
  - Keep CSS minimal and organized
  - Follow SolidJS best practices (no hooks, use createSignal/createMemo)
- **No Emojis:** Unless explicitly requested by user
- **Tool Usage:**
  - Prefer specialized tools over bash commands
  - Use Task tool for complex explorations
  - Always read file before editing
  - Use parallel tool calls when independent

## Key Implementation Details

### SolidJS Setup

- Use SolidJS 1.x with solid-js/h for JSX
- Components should be functional and reactive
- Leverage Solid's fine-grained reactivity for performance

### PicoCSS Theme

- Disable PicoCSS auto-theming where needed
- Customize primary colors to match Fossiq branding
- Use CSS variables for extensibility
- System font stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto`

### CodeMirror Integration

- Use `@codemirror/lang-kusto` (or similar for Kusto)
- Configure editor with reasonable defaults (line numbers, syntax highlighting)
- Handle result clearing on new queries

### TanStack Solid Table

- Use alpha version for SolidJS compatibility
- Implement virtual scrolling for large result sets
- Support dynamic columns from query results
- Add sorting/filtering if time permits

### CDN External Packages

- Define CDN URLs in environment config
- Load @fossiq/kql-to-duckdb and other packages from CDN
- Fallback to local bundled versions if CDN unavailable

### DuckDB WASM Integration

- **Setup:** Uses `@duckdb/duckdb-wasm` with a dedicated `SchemaContext`.
- **Static Files:** Requires `duckdb-eh.wasm` and `duckdb-browser-eh.worker.js` to be served from the `public/` directory to avoid bundling issues and ensure correct worker initialization.
- **Headers:** `vite.config.ts` must configure COOP (`Cross-Origin-Opener-Policy: same-origin`) and COEP (`Cross-Origin-Embedder-Policy: require-corp`) headers for WASM multi-threading support (though we currently use the EH single-threaded variant as a safe default).
- **Data Loading:** Uses the File System Access API (via `showOpenFilePicker`) to register file handles directly with DuckDB, allowing efficient querying of local CSVs without full memory loading where supported.

### File Persistence Across Page Reloads

- **Storage:** File handles are stored in IndexedDB (`fossiq-file-handles` database) after loading.
- **Restore Flow:**
  1. On page load, `SchemaContext` checks for stored file handles
  2. For each handle, `queryPermission()` checks if permission is already granted
  3. Files with permission are restored automatically
  4. Files needing permission are queued in `pendingFiles` state
  5. A "Restore X files" button appears in the sidebar
  6. Clicking triggers `requestPermission()` (requires user gesture) and loads files
- **Cleanup:** When a table is removed, its file handle is also removed from IndexedDB.
- **Fallback:** Files loaded via `<input type="file">` fallback cannot be persisted (no FileSystemFileHandle).
- **Utility:** `src/utils/fileHandleStore.ts` provides `storeFileHandle`, `getStoredFileHandles`, `removeFileHandle`, `clearAllFileHandles` functions.

## Notes & Gotchas

- **Solid vs React:** Remember Solid has different reactivity model - no hooks, use createSignal/createMemo
- **TypeScript in SolidJS:** Ensure correct JSX settings in tsconfig
- **PicoCSS Defaults:** Override default styles carefully to avoid specificity issues
- **CodeMirror Bundle Size:** Consider lazy loading editor if bundle becomes too large
- **Table Virtualization:** Test with large datasets to ensure smooth scrolling
- **Dark Mode:** Test theme switching on all components

## Success Criteria

- Clean, responsive UI that resembles Azure Data Explorer
- Fast query editor with syntax highlighting
- Virtualized table that handles large result sets efficiently
- Proper light/dark theme support
- External Fossiq packages load and integrate seamlessly
