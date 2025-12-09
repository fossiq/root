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
};
