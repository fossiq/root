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
};
