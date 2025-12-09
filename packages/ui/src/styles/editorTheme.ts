import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { EditorView } from "@codemirror/view";

// GitHub Primer design system colors
// Source: https://cdn.jsdelivr.net/npm/@primer/primitives@latest/dist/js/colors/
const colors = {
  light: {
    // Syntax highlighting
    keyword: "#cf222e", // pl-k - red
    number: "#0550ae", // pl-c1 - blue
    string: "#0a3069", // pl-s - dark blue
    comment: "#6e7781", // pl-c - gray
    function: "#8250df", // pl-en - purple
    type: "#953800", // pl-v - orange/brown (table names)
    property: "#0550ae", // pl-c1 - blue (column names)
    punctuation: "#1F2328", // fg.default
    operator: "#0550ae", // pl-c1 - blue
    bracket: "#0550ae", // pl-c1 - blue (parentheses)
    // Editor chrome
    fg: "#1F2328", // fg.default
    fgMuted: "#656d76", // fg.muted
    canvasDefault: "#ffffff", // canvas.default
    canvasSubtle: "#f6f8fa", // canvas.subtle
    borderDefault: "#d0d7de", // border.default
    accentFg: "#0969da", // accent.fg
  },
  dark: {
    // Syntax highlighting
    keyword: "#ff7b72", // pl-k - red
    number: "#79c0ff", // pl-c1 - blue
    string: "#a5d6ff", // pl-s - light blue
    comment: "#8b949e", // pl-c - gray
    function: "#d2a8ff", // pl-en - purple
    type: "#ffa657", // pl-v - orange (table names)
    property: "#79c0ff", // pl-c1 - blue (column names)
    punctuation: "#e6edf3", // fg.default
    operator: "#79c0ff", // pl-c1 - blue
    bracket: "#79c0ff", // pl-c1 - blue (parentheses)
    // Editor chrome
    fg: "#e6edf3", // fg.default
    fgMuted: "#7d8590", // fg.muted
    canvasDefault: "#0d1117", // canvas.default
    canvasSubtle: "#161b22", // canvas.subtle
    borderDefault: "#30363d", // border.default
    accentFg: "#2f81f7", // accent.fg
  },
};

export const kqlLightHighlightStyle = HighlightStyle.define([
  // Keywords: bold red - stands out distinctly
  { tag: t.keyword, color: colors.light.keyword, fontWeight: "bold" },
  { tag: t.operatorKeyword, color: colors.light.keyword, fontWeight: "bold" },
  // Operators and numbers: blue
  { tag: t.operator, color: colors.light.operator },
  { tag: t.compareOperator, color: colors.light.operator },
  { tag: t.number, color: colors.light.number },
  // Strings: dark blue
  { tag: t.string, color: colors.light.string },
  // Comments: muted gray, italic
  { tag: t.comment, color: colors.light.comment, fontStyle: "italic" },
  // Functions: purple - distinct from keywords
  { tag: t.function(t.variableName), color: colors.light.function },
  // Table names: orange
  { tag: t.typeName, color: colors.light.type },
  // Column/property names: blue
  { tag: t.propertyName, color: colors.light.property },
  // Variables/identifiers: default foreground (not colored) - distinct from keywords
  { tag: t.variableName, color: colors.light.fg },
  // Punctuation
  { tag: t.punctuation, color: colors.light.punctuation },
  { tag: t.separator, color: colors.light.punctuation },
  // Brackets: colored
  { tag: t.paren, color: colors.light.bracket },
]);

export const kqlDarkHighlightStyle = HighlightStyle.define([
  // Keywords: bold red - stands out distinctly
  { tag: t.keyword, color: colors.dark.keyword, fontWeight: "bold" },
  { tag: t.operatorKeyword, color: colors.dark.keyword, fontWeight: "bold" },
  // Operators and numbers: blue
  { tag: t.operator, color: colors.dark.operator },
  { tag: t.compareOperator, color: colors.dark.operator },
  { tag: t.number, color: colors.dark.number },
  // Strings: light blue
  { tag: t.string, color: colors.dark.string },
  // Comments: muted gray, italic
  { tag: t.comment, color: colors.dark.comment, fontStyle: "italic" },
  // Functions: purple - distinct from keywords
  { tag: t.function(t.variableName), color: colors.dark.function },
  // Table names: orange
  { tag: t.typeName, color: colors.dark.type },
  // Column/property names: blue
  { tag: t.propertyName, color: colors.dark.property },
  // Variables/identifiers: default foreground (not colored) - distinct from keywords
  { tag: t.variableName, color: colors.dark.fg },
  // Punctuation
  { tag: t.punctuation, color: colors.dark.punctuation },
  { tag: t.separator, color: colors.dark.punctuation },
  // Brackets: colored
  { tag: t.paren, color: colors.dark.bracket },
]);

export const kqlLightTheme = [
  syntaxHighlighting(kqlLightHighlightStyle),
  EditorView.theme({
    "&": {
      backgroundColor: colors.light.canvasDefault,
      color: colors.light.fg,
    },
    ".cm-cursor": {
      borderLeftColor: colors.light.fg,
    },
    ".cm-gutters": {
      backgroundColor: colors.light.canvasSubtle,
      color: colors.light.fgMuted,
      borderRight: `1px solid ${colors.light.borderDefault}`,
    },
    ".cm-activeLine": {
      backgroundColor: "rgba(208, 215, 222, 0.32)", // border.default with opacity
    },
    ".cm-activeLineGutter": {
      backgroundColor: "rgba(208, 215, 222, 0.32)",
    },
    ".cm-selectionBackground": {
      backgroundColor: "rgba(9, 105, 218, 0.15)", // accent.fg with opacity
    },
    "&.cm-focused .cm-selectionBackground": {
      backgroundColor: "rgba(9, 105, 218, 0.2)",
    },
  }),
];

export const kqlDarkTheme = [
  syntaxHighlighting(kqlDarkHighlightStyle),
  EditorView.theme(
    {
      "&": {
        backgroundColor: colors.dark.canvasDefault,
        color: colors.dark.fg,
      },
      ".cm-cursor": {
        borderLeftColor: colors.dark.fg,
      },
      ".cm-gutters": {
        backgroundColor: colors.dark.canvasSubtle,
        color: colors.dark.fgMuted,
        borderRight: `1px solid ${colors.dark.borderDefault}`,
      },
      ".cm-activeLine": {
        backgroundColor: "rgba(48, 54, 61, 0.48)", // border.default with opacity
      },
      ".cm-activeLineGutter": {
        backgroundColor: "rgba(48, 54, 61, 0.48)",
      },
      ".cm-selectionBackground": {
        backgroundColor: "rgba(47, 129, 247, 0.15)", // accent.fg with opacity
      },
      "&.cm-focused .cm-selectionBackground": {
        backgroundColor: "rgba(47, 129, 247, 0.25)",
      },
    },
    { dark: true }
  ),
];
