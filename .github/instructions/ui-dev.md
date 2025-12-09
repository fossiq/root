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
│   │   ├── Editor/          # CodeMirror-based query editor
│   │   ├── Table/           # TanStack Solid Table wrapper
│   │   ├── Layout/          # Main app layout (similar to ADX)
│   │   └── Icons/           # Icon components (from css.gg)
│   ├── styles/              # PicoCSS theme customization
│   ├── types.ts             # Type definitions
│   └── index.tsx            # Main entry point
├── dist/                     # Build output
├── package.json
├── tsconfig.json
├── bunfig.toml              # Bun bundler configuration
└── README.md
```

## Implementation Phases

### Phase 1: Project Setup ✓ (Planning)

- [x] Create documentation (this file)
- [ ] Create `packages/ui/` directory structure
- [ ] Set up `package.json` with dependencies
- [ ] Configure `tsconfig.json` and `bunfig.toml`
- [ ] Create basic index.tsx entry point

### Phase 2: Layout & Theming

- [ ] Set up PicoCSS with system native fonts
- [ ] Implement light/dark theme auto-detection and switching
- [ ] Create main Layout component (header, sidebar, editor pane, results pane)
- [ ] Add basic header with title and controls

### Phase 3: Editor Component

- [ ] Integrate CodeMirror with Kusto language support
- [ ] Create Editor component wrapper
- [ ] Add query submission button
- [ ] Style editor to match ADX aesthetic

### Phase 4: Results Table

- [ ] Integrate @tanstack/solid-table@alpha
- [ ] Implement virtualized table component
- [ ] Handle dynamic column generation from KQL results
- [ ] Add table styling with PicoCSS

### Phase 5: Icons & Visual Polish

- [ ] Add css.gg icons to components (header icons, buttons)
- [ ] Polish layout spacing and alignment
- [ ] Add ADX-style visual hierarchy

### Phase 6: External Dependencies Integration

- [ ] Configure CDN URLs for @fossiq/kql\* packages
- [ ] Create module loading utilities
- [ ] Test loading and using external packages

### Phase 7: Testing & Optimization

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
