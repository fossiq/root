/**
 * Icon definitions
 * Define SVG paths here and reference them in the Icon component
 */

export const icons: Record<string, { viewBox: string; path: string }> = {
  "plus-circle": {
    viewBox: "0 0 24 24",
    path: `<g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 8v8M8 12h8"/>
    </g>`,
  },
  logo: {
    viewBox: "0 0 24 24",
    path: `<g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M8 8L4 12l4 4M16 8l4 4-4 4M12 6v12"/>
    </g>`,
  },
  table: {
    viewBox: "0 0 24 24",
    path: `<g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <rect x="4" y="4" width="16" height="16" rx="1"/>
      <path d="M4 9h16M11 9v11M4 14h7"/>
    </g>`,
  },
  column: {
    viewBox: "0 0 24 24",
    path: `<g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <rect x="3" y="6" width="18" height="12" rx="2"/>
      <path d="M10 6v12M17 6v12"/>
    </g>`,
  },
  theme: {
    viewBox: "0 0 24 24",
    path: `<g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <circle cx="12" cy="12" r="9"/>
      <path d="M12 3v18" fill="currentColor" stroke="none"/>
      <path d="M12 3a9 9 0 0 1 0 18V3z" fill="currentColor" stroke="none"/>
    </g>`,
  },
  "chevron-right": {
    viewBox: "0 0 24 24",
    path: `<path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M9 6l6 6-6 6"/>`,
  },
  "chevron-down": {
    viewBox: "0 0 24 24",
    path: `<path stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none" d="M6 9l6 6 6-6"/>`,
  },
  "x-circle": {
    viewBox: "0 0 24 24",
    path: `<g stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none">
      <path d="M8 8l8 8M16 8l-8 8"/>
    </g>`,
  },
  "sidebar-collapsed": {
    viewBox: "0 0 24 24",
    path: `<path stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" fill="none" d="M2 12c0-3.75 0-5.625.955-6.939A5 5 0 0 1 4.06 3.955C5.375 3 7.251 3 11 3h2c3.75 0 5.625 0 6.939.955a5 5 0 0 1 1.106 1.106C22 6.375 22 8.251 22 12s0 5.625-.955 6.939a5 5 0 0 1-1.106 1.106C18.625 21 16.749 21 13 21h-2c-3.75 0-5.625 0-6.939-.955a5 5 0 0 1-1.106-1.106C2 17.625 2 15.749 2 12ZM9.5 3.5v17M5 7h1.5M5 11h1.5"/><path stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" fill="none" d="m17 10-1.226 1.057c-.516.445-.774.667-.774.943s.258.498.774.943L17 14"/>`,
  },
  "sidebar-expanded": {
    viewBox: "0 0 24 24",
    path: `<path stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" fill="none" d="M22 12c0-3.75 0-5.625-.955-6.939a5 5 0 0 0-1.106-1.106C18.625 3 16.749 3 13 3h-2c-3.75 0-5.625 0-6.939.955A5 5 0 0 0 2.955 5.06C2 6.375 2 8.251 2 12s0 5.625.955 6.939a5 5 0 0 0 1.106 1.106C5.375 21 7.251 21 11 21h2c3.75 0 5.625 0 6.939-.955a5 5 0 0 0 1.106-1.106C22 17.625 22 15.749 22 12ZM14.5 3.5v17M19 7h-1.5M19 11h-1.5"/><path stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" fill="none" d="m8 10 1.227 1.057c.515.445.773.667.773.943s-.258.498-.773.943L8 14"/>`,
  },
};
