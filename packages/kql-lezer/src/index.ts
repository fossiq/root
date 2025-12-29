import type {
  ParseResult,
  HighlightToken,
  TokenType,
  ParseError,
} from "@fossiq/kql-ast";
import { parser } from "./parser";
import { cstToAst } from "./parser/cst-to-ast";

/**
 * Map token names to TokenType for syntax highlighting
 */
function getTokenType(tokenName: string): TokenType | null {
  switch (tokenName) {
    case "LineComment":
      return "comment";
    case "Identifier":
      return "identifier";
    case "Number":
      return "number";
    case "Timespan":
      return "number";
    case "String":
      return "string";
    case "let":
    case "where":
    case "project":
    case "project-away":
    case "project-keep":
    case "project-rename":
    case "project-reorder":
    case "extend":
    case "sort":
    case "order":
    case "by":
    case "asc":
    case "desc":
    case "nulls":
    case "first":
    case "last":
    case "limit":
    case "take":
    case "top":
    case "distinct":
    case "summarize":
    case "mv-expand":
    case "union":
    case "kind":
    case "inner":
    case "outer":
    case "withsource":
    case "search":
    case "find":
    case "in":
    case "case_sensitive":
    case "case_insensitive":
    case "and":
    case "or":
    case "not":
    case "between":
    case "!between":
    case "contains":
    case "!contains":
    case "contains_cs":
    case "!contains_cs":
    case "startswith":
    case "!startswith":
    case "startswith_cs":
    case "!startswith_cs":
    case "endswith":
    case "!endswith":
    case "endswith_cs":
    case "!endswith_cs":
    case "has":
    case "!has":
    case "has_cs":
    case "!has_cs":
    case "hasprefix":
    case "!hasprefix":
    case "hassuffix":
    case "!hassuffix":
    case "matches":
    case "regex":
      return "keyword";
    case "Plus":
    case "Minus":
    case "Star":
    case "Slash":
    case "Percent":
    case "ComparisonOp":
    case "Equals":
    case "Pipe":
      return "operator";
    case "OpenParen":
    case "CloseParen":
    case "OpenBracket":
    case "CloseBracket":
    case "Comma":
    case "Semicolon":
      return "punctuation";
    default:
      return null;
  }
}

function walkTree(
  cursor: { firstChild(): boolean; nextSibling(): boolean; parent(): void },
  visit: () => void
): void {
  const hasChild = cursor.firstChild();
  if (hasChild) {
    do {
      walkTree(cursor, visit);
    } while (cursor.nextSibling());
    cursor.parent();
    return;
  }
  visit();
}

export function parseErrors(doc: string): ParseError[] {
  const tree = parser.parse(doc);
  const errors: ParseError[] = [];
  const cursor = tree.cursor();

  walkTree(cursor, () => {
    if (cursor.type.isError || cursor.type.name === "⚠") {
      errors.push({
        type: "ParseError",
        message: "Parse error",
        start: cursor.from,
        end: cursor.to,
      });
    }
  });

  return errors;
}

/**
 * Extract highlight tokens from Chevrotain lex result for syntax highlighting
 */
export function extractHighlightTokens(doc: string): HighlightToken[] {
  const tree = parser.parse(doc);
  const tokens: HighlightToken[] = [];
  const cursor = tree.cursor();

  walkTree(cursor, () => {
    if (cursor.type.isError || cursor.type.name === "⚠") {
      return;
    }
    const tokenType = getTokenType(cursor.type.name);
    if (!tokenType) {
      return;
    }
    if (cursor.from >= cursor.to) {
      return;
    }
    tokens.push({
      type: tokenType,
      start: cursor.from,
      end: cursor.to,
      value: doc.slice(cursor.from, cursor.to),
    });
  });

  return tokens;
}

/**
 * Parse KQL and return both AST and highlight tokens
 */
export function parseKQL(doc: string): ParseResult {
  const tree = parser.parse(doc);
  const errors = parseErrors(doc);
  const tokens = extractHighlightTokens(doc);
  let ast: ParseResult["ast"];

  if (errors.length === 0) {
    const result = cstToAst(tree, doc);
    if (result.type === "ErrorNode") {
      errors.push({
        type: "ParseError",
        message: result.error,
        start: result.start,
        end: result.end,
      });
    } else {
      ast = result;
    }
  }

  return {
    ast,
    tokens,
    errors,
  };
}
