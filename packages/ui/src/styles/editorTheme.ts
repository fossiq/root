import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { tags as t } from "@lezer/highlight";
import { EditorView } from "@codemirror/view";

// KQL syntax highlighting colors inspired by Monaco Kusto and GitHub Primer
// Designed for clear visual distinction between different token types
const colors = {
  light: {
    // Query operators (where, project, etc.) - bold blue like Monaco
    queryOperator: "#0000FF",
    // Definition keywords (let) - blue
    definitionKeyword: "#0000FF",
    // Modifiers (by, asc, desc, join kinds) - blue
    modifier: "#0550ae",
    // Logical operators (and, or, not) - dark gray
    logicOperator: "#1F2328",
    // String operators (contains, has, etc.) - orange-red like Monaco
    operatorKeyword: "#CE3600",
    // Comparison and math operators - orange-red
    operator: "#CE3600",
    // Numbers - dark blue
    number: "#0550ae",
    // Strings - firebrick red like Monaco
    string: "#B22222",
    // Comments - muted gray
    comment: "#6e7781",
    // Functions - purple for distinction
    function: "#8250df",
    // Table names - dark orchid/purple like Monaco
    table: "#9932CC",
    // Column/property names - teal for distinction from tables
    column: "#0550ae",
    // Variables - default foreground
    variable: "#1F2328",
    // Defined variables (in let statements) - bold
    definition: "#1F2328",
    // Punctuation - subtle gray
    punctuation: "#656d76",
    // Brackets - blue
    bracket: "#0550ae",
    // Editor chrome
    fg: "#1F2328",
    fgMuted: "#656d76",
    canvasDefault: "#ffffff",
    canvasSubtle: "#f6f8fa",
    borderDefault: "#d0d7de",
    accentFg: "#0969da",
  },
  dark: {
    // Query operators (where, project, etc.) - sky blue like Monaco dark
    queryOperator: "#569CD6",
    // Definition keywords (let) - sky blue
    definitionKeyword: "#569CD6",
    // Modifiers (by, asc, desc, join kinds) - lighter blue
    modifier: "#9CDCFE",
    // Logical operators (and, or, not) - light foreground
    logicOperator: "#e6edf3",
    // String operators (contains, has, etc.) - medium turquoise like Monaco
    operatorKeyword: "#4EC9B0",
    // Comparison and math operators - turquoise
    operator: "#4EC9B0",
    // Numbers - light blue
    number: "#B5CEA8",
    // Strings - pale chestnut/salmon like Monaco
    string: "#CE9178",
    // Comments - muted gray
    comment: "#6A9955",
    // Functions - light purple
    function: "#DCDCAA",
    // Table names - soft gold like Monaco dark
    table: "#D7BA7D",
    // Column/property names - light blue
    column: "#9CDCFE",
    // Variables - default foreground
    variable: "#e6edf3",
    // Defined variables (in let statements) - light blue
    definition: "#9CDCFE",
    // Punctuation - muted
    punctuation: "#808080",
    // Brackets - light blue
    bracket: "#569CD6",
    // Editor chrome
    fg: "#e6edf3",
    fgMuted: "#7d8590",
    canvasDefault: "#0d1117",
    canvasSubtle: "#161b22",
    borderDefault: "#30363d",
    accentFg: "#2f81f7",
  },
};

export const kqlLightHighlightStyle = HighlightStyle.define([
  // Query operators (where, project, etc.): bold blue
  { tag: t.keyword, color: colors.light.queryOperator, fontWeight: "bold" },
  // Definition keywords (let): blue
  {
    tag: t.definitionKeyword,
    color: colors.light.definitionKeyword,
    fontWeight: "bold",
  },
  // Modifiers (by, asc, desc): blue
  { tag: t.modifier, color: colors.light.modifier },
  // Logical operators (and, or, not): dark gray
  {
    tag: t.logicOperator,
    color: colors.light.logicOperator,
    fontWeight: "bold",
  },
  // String operators (contains, has): orange-red
  {
    tag: t.operatorKeyword,
    color: colors.light.operatorKeyword,
    fontWeight: "bold",
  },
  // Comparison/Math operators: orange-red
  { tag: t.compareOperator, color: colors.light.operator },
  { tag: t.arithmeticOperator, color: colors.light.operator },
  { tag: t.operator, color: colors.light.operator },
  { tag: t.definitionOperator, color: colors.light.operator },
  // Numbers: dark blue
  { tag: t.number, color: colors.light.number },
  // Strings: firebrick red
  { tag: t.string, color: colors.light.string },
  // Comments: muted gray
  { tag: t.comment, color: colors.light.comment, fontStyle: "italic" },
  // Functions: purple
  { tag: t.function(t.variableName), color: colors.light.function },
  // Table names: dark orchid/purple
  { tag: t.typeName, color: colors.light.table },
  // Column/property names: teal
  { tag: t.propertyName, color: colors.light.column },
  // Variables/identifiers: default foreground
  { tag: t.variableName, color: colors.light.variable },
  // Defined variables: bold
  {
    tag: t.definition(t.variableName),
    color: colors.light.definition,
    fontWeight: "bold",
  },
  // Punctuation and brackets
  { tag: t.punctuation, color: colors.light.punctuation },
  { tag: t.separator, color: colors.light.punctuation },
  { tag: t.paren, color: colors.light.bracket },
  { tag: t.squareBracket, color: colors.light.bracket },
]);

export const kqlDarkHighlightStyle = HighlightStyle.define([
  // Query operators (where, project, etc.): sky blue
  { tag: t.keyword, color: colors.dark.queryOperator, fontWeight: "bold" },
  // Definition keywords (let): sky blue
  {
    tag: t.definitionKeyword,
    color: colors.dark.definitionKeyword,
    fontWeight: "bold",
  },
  // Modifiers (by, asc, desc): lighter blue
  { tag: t.modifier, color: colors.dark.modifier },
  // Logical operators (and, or, not): light foreground
  {
    tag: t.logicOperator,
    color: colors.dark.logicOperator,
    fontWeight: "bold",
  },
  // String operators (contains, has): medium turquoise
  {
    tag: t.operatorKeyword,
    color: colors.dark.operatorKeyword,
    fontWeight: "bold",
  },
  // Comparison/Math operators: turquoise
  { tag: t.compareOperator, color: colors.dark.operator },
  { tag: t.arithmeticOperator, color: colors.dark.operator },
  { tag: t.operator, color: colors.dark.operator },
  { tag: t.definitionOperator, color: colors.dark.operator },
  // Numbers: light blue
  { tag: t.number, color: colors.dark.number },
  // Strings: pale chestnut/salmon
  { tag: t.string, color: colors.dark.string },
  // Comments: muted gray
  { tag: t.comment, color: colors.dark.comment, fontStyle: "italic" },
  // Functions: light purple
  { tag: t.function(t.variableName), color: colors.dark.function },
  // Table names: soft gold
  { tag: t.typeName, color: colors.dark.table },
  // Column/property names: light blue
  { tag: t.propertyName, color: colors.dark.column },
  // Variables/identifiers: default foreground
  { tag: t.variableName, color: colors.dark.variable },
  // Defined variables: light blue
  {
    tag: t.definition(t.variableName),
    color: colors.dark.definition,
    fontWeight: "bold",
  },
  // Punctuation and brackets
  { tag: t.punctuation, color: colors.dark.punctuation },
  { tag: t.separator, color: colors.dark.punctuation },
  { tag: t.paren, color: colors.dark.bracket },
  { tag: t.squareBracket, color: colors.dark.bracket },
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
