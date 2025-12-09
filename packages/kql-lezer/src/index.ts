import type {
  ParseResult,
  HighlightToken,
  TokenType,
  KQLDocument,
} from "@fossiq/kql-ast";
import { TokenType as TT } from "@fossiq/kql-ast";
import { parser } from "./parser";
import { Tree, SyntaxNode } from "@lezer/common";

/**
 * Convert Lezer parse tree to @fossiq/kql-ast ParseResult
 *
 * This allows the Lezer parser output to be compatible with
 * other KQL tools expecting the shared AST format.
 */
export function toParsedAST(doc: string): ParseResult {
  const tree = parser.parse(doc);
  const errors = findErrors(tree, doc);

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
    const tokenType = getTokenType(node.name, text);
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
  const errors = findErrors(tree, doc);
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
function findErrors(tree: Tree, doc: string) {
  const errors = [];

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
function getTokenType(nodeName: string, text: string): TokenType | null {
  switch (nodeName) {
    case "LineComment":
      return TT.Comment;
    case "Identifier":
      return TT.Identifier;
    case "Number":
      return TT.Number;
    case "String":
      return TT.String;
    case "Query":
    case "statement":
    case "expression":
      return null; // Internal nodes, not highlighted
    default:
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

/**
 * Initialize KQL language for CodeMirror
 *
 * TODO: Implement once dependency versions are aligned
 * This would return: new LanguageSupport(kqlLanguage)
 */
export function kql() {
  // Placeholder for CodeMirror language support
  return null;
}
