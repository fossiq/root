import type {
  ParseResult,
  HighlightToken,
  TokenType,
  ParseError,
} from "@fossiq/kql-ast";
import { TokenType as TT } from "@fossiq/kql-ast";
import { parser } from "./parser";
import { Tree, SyntaxNode } from "@lezer/common";
import { LRLanguage, LanguageSupport } from "@codemirror/language";
import { styleTags, tags as t } from "@lezer/highlight";

/**
 * Convert Lezer parse tree to @fossiq/kql-ast ParseResult
 *
 * This allows the Lezer parser output to be compatible with
 * other KQL tools expecting the shared AST format.
 */
export function toParsedAST(doc: string): ParseResult {
  const tree = parser.parse(doc);
  const errors = findErrors(tree);

  return {
    ast: undefined, // TODO: Full AST conversion when needed
    errors,
  };
}

/**
 * Extract highlight tokens from Lezer parse tree for syntax highlighting
 */
export function extractHighlightTokens(doc: string): HighlightToken[] {
  const tree = parser.parse(doc);
  const tokens: HighlightToken[] = [];

  walkTree(tree.topNode, doc, (node, text) => {
    const tokenType = getTokenType(node.name);
    if (tokenType) {
      tokens.push({
        type: tokenType,
        start: node.from,
        end: node.to,
        value: text,
      });
    }
  });

  return tokens;
}

/**
 * Parse KQL and return both AST and highlight tokens
 */
export function parseKQL(doc: string): ParseResult {
  const tree = parser.parse(doc);
  const errors = findErrors(tree);
  const tokens = extractHighlightTokens(doc);

  return {
    ast: undefined,
    tokens,
    errors,
  };
}

/**
 * Find parse errors in the tree
 */
function findErrors(tree: Tree): ParseError[] {
  const errors: ParseError[] = [];

  const cursor = tree.cursor();
  do {
    if (cursor.name === "⚠") {
      errors.push({
        type: "ParseError" as const,
        message: `Syntax error at position ${cursor.from}`,
        start: cursor.from,
        end: cursor.to,
      });
    }
  } while (cursor.next());

  return errors;
}

/**
 * Map token names to TokenType for syntax highlighting
 */
function getTokenType(nodeName: string): TokenType | null {
  switch (nodeName) {
    case "LineComment":
      return TT.Comment;
    case "Identifier":
      return TT.Identifier;
    case "Number":
      return TT.Number;
    case "String":
      return TT.String;
    // Keywords
    case "kw_where":
    case "kw_project":
    case "kw_extend":
    case "kw_sort":
    case "kw_limit":
    case "kw_take":
    case "kw_top":
    case "kw_distinct":
    case "kw_summarize":
    case "kw_by":
    case "kw_asc":
    case "kw_desc":
    case "kw_and":
    case "kw_or":
    case "kw_not":
    case "kw_contains":
    case "kw_notcontains":
    case "kw_startswith":
    case "kw_endswith":
    case "kw_has":
    case "kw_nothas":
    case "kw_in":
    case "kw_notin":
    case "let":
      return TT.Keyword;
    // Operators
    case "Pipe":
    case "ComparisonOp":
      return TT.Operator;
    // Punctuation
    case "ParenthesizedExpression":
    case "BracketExpression":
      return TT.Punctuation;
    default:
      // For internal nodes like Query, statement, expression
      if (nodeName.endsWith("Clause")) {
        return TT.Keyword; // Operators like where, project etc.
      }
      return null;
  }
}

/**
 * Walk the parse tree and call callback for each node
 */
function walkTree(
  node: SyntaxNode | null,
  doc: string,
  callback: (node: SyntaxNode, text: string) => void
): void {
  if (!node) return;

  const text = doc.slice(node.from, node.to);
  callback(node, text);

  let child = node.firstChild;
  while (child) {
    walkTree(child, doc, callback);
    child = child.nextSibling;
  }
}

// Define the KQL language for Lezer
export const kqlLanguage = LRLanguage.define({
  parser: parser.configure({
    props: [
      styleTags({
        // Keywords
        "kw_where kw_project kw_extend kw_sort kw_limit kw_take kw_top kw_distinct kw_summarize kw_by kw_asc kw_desc kw_and kw_or kw_not": t.keyword,
        "kw_contains kw_notcontains kw_startswith kw_endswith kw_has kw_nothas kw_in kw_notin": t.operatorKeyword,
        // Operators
        Pipe: t.punctuation,
        ComparisonOp: t.operator,
        // Literals
        Number: t.number,
        String: t.string,
        // Comments
        LineComment: t.lineComment,
        // Identifiers
        Identifier: t.variableName,
        functionName: t.function(t.variableName),
        // Structure
        "ParenthesizedExpression BracketExpression": t.paren,
        "operator": t.typeName // Generic operator nodes
      }),
    ],
  }),
  languageData: {
    commentTokens: { line: "//" },
  },
});

/**
 * Initialize KQL language for CodeMirror
 */
export function kql() {
  return new LanguageSupport(kqlLanguage);
}

