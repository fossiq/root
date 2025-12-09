import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { EditorView } from "@codemirror/view";

// Colors from theme.css
const colors = {
  light: {
    keyword: "#3b82f6", // --accent-blue
    number: "#a04000",
    string: "#1a1aab",
    comment: "#888888",
    function: "#7c3aed",
    type: "#d97706",
    variable: "#2c3e50", // --text-primary
    punctuation: "#6b7280", // --text-secondary
  },
  dark: {
    keyword: "#60a5fa", // --accent-blue
    number: "#ffd7a0",
    string: "#add8e6",
    comment: "#888888",
    function: "#c4b5fd",
    type: "#fbbf24",
    variable: "#f1f5f9", // --text-primary
    punctuation: "#cbd5e1", // --text-secondary
  },
};

export const kqlLightHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: colors.light.keyword, fontWeight: "bold" },
  { tag: t.operatorKeyword, color: colors.light.keyword, fontWeight: "bold" },
  { tag: t.operator, color: colors.light.keyword },
  { tag: t.number, color: colors.light.number },
  { tag: t.string, color: colors.light.string },
  { tag: t.comment, color: colors.light.comment, fontStyle: "italic" },
  { tag: t.function(t.variableName), color: colors.light.function },
  { tag: t.typeName, color: colors.light.type },
  { tag: t.variableName, color: colors.light.variable },
  { tag: t.punctuation, color: colors.light.punctuation },
  { tag: t.paren, color: colors.light.punctuation },
]);

export const kqlDarkHighlightStyle = HighlightStyle.define([
  { tag: t.keyword, color: colors.dark.keyword, fontWeight: "bold" },
  { tag: t.operatorKeyword, color: colors.dark.keyword, fontWeight: "bold" },
  { tag: t.operator, color: colors.dark.keyword },
  { tag: t.number, color: colors.dark.number },
  { tag: t.string, color: colors.dark.string },
  { tag: t.comment, color: colors.dark.comment, fontStyle: "italic" },
  { tag: t.function(t.variableName), color: colors.dark.function },
  { tag: t.typeName, color: colors.dark.type },
  { tag: t.variableName, color: colors.dark.variable },
  { tag: t.punctuation, color: colors.dark.punctuation },
  { tag: t.paren, color: colors.dark.punctuation },
]);

export const kqlLightTheme = [
  syntaxHighlighting(kqlLightHighlightStyle),
  EditorView.theme({
    "&": {
      backgroundColor: "#ffffff",
      color: "#2c3e50",
    },
    ".cm-cursor": {
      borderLeftColor: "#2c3e50",
    },
    ".cm-gutters": {
      backgroundColor: "#f9f9fb",
      color: "#6b7280",
      borderRight: "1px solid #e5e7eb",
    },
    ".cm-activeLine": {
      backgroundColor: "rgba(59, 130, 246, 0.05)",
    },
    ".cm-activeLineGutter": {
      backgroundColor: "rgba(59, 130, 246, 0.05)",
    },
  }),
];

export const kqlDarkTheme = [
  syntaxHighlighting(kqlDarkHighlightStyle),
  EditorView.theme(
    {
      "&": {
        backgroundColor: "#0f172a",
        color: "#f1f5f9",
      },
      ".cm-cursor": {
        borderLeftColor: "#f1f5f9",
      },
      ".cm-gutters": {
        backgroundColor: "#1e293b",
        color: "#cbd5e1",
        borderRight: "1px solid #334155",
      },
      ".cm-activeLine": {
        backgroundColor: "rgba(59, 130, 246, 0.05)",
      },
      ".cm-activeLineGutter": {
        backgroundColor: "rgba(59, 130, 246, 0.05)",
      },
    },
    { dark: true }
  ),
];
