/**
 * Icon definitions
 * Define SVG paths here and reference them in the Icon component
 */

export const icons: Record<string, { viewBox: string; path: string }> = {
  "plus-circle": {
    viewBox: "0 0 24 24",
    path: `<g fill="currentColor" fill-rule="evenodd" clip-rule="evenodd">
      <path d="M2 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10S2 17.523 2 12m10-8a8 8 0 1 0 0 16 8 8 0 0 0 0-16"/>
      <path d="M13 7a1 1 0 1 0-2 0v4H7a1 1 0 1 0 0 2h4v4a1 1 0 1 0 2 0v-4h4a1 1 0 1 0 0-2h-4z"/>
    </g>`,
  },
  logo: {
    viewBox: "0 0 24 24",
    path: `<path fill="currentColor" d="M8.976 12 4.733 7.757 3.32 9.172 6.147 12 3.32 14.828l1.414 1.415zM12 19a1 1 0 0 1-1-1V6a1 1 0 1 1 2 0v12a1 1 0 0 1-1 1M15.024 12l4.243 4.243 1.414-1.415L17.853 12l2.828-2.828-1.414-1.415z"/>`,
  },
  table: {
    viewBox: "0 0 24 24",
    path: `<path fill="currentColor" d="M4 4h16v16H4V4zm2 5h12V6H6v3zm0 2v7h5v-7H6zm7 0v7h5v-7h-5z"/>`,
  },
  column: {
    viewBox: "0 0 24 24",
    path: `<path fill="currentColor" fill-rule="evenodd" d="M2 8a3 3 0 0 1 3-3h14a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H5a3 3 0 0 1-3-3zm14-1h3a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1h-3zm-2 0h-4v10h4zM8 17V7H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1z" clip-rule="evenodd"/>`,
  },
  theme: {
    viewBox: "0 0 24 24",
    path: `<path fill="currentColor" d="M12 16a4 4 0 0 0 0-8z"/><path fill="currentColor" fill-rule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2m0 2v4a4 4 0 1 0 0 8v4a8 8 0 1 0 0-16" clip-rule="evenodd"/>`,
  },
  "chevron-right": {
    viewBox: "0 0 24 24",
    path: `<path fill="currentColor" d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/>`,
  },
  "chevron-down": {
    viewBox: "0 0 24 24",
    path: `<path fill="currentColor" d="M16.59 8.59L12 13.17 7.41 8.59 6 10l6 6 6-6z"/>`,
  },
};
