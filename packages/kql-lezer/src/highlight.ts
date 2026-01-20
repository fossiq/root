import type { HighlightToken, TokenType } from "@fossiq/kql-ast";
import { parser } from "./parser";
import { walkTree } from "./parse-utils";

function getTokenType(tokenName: string): TokenType | null {
  switch (tokenName) {
    case "LineComment":
      return "comment";
    case "Identifier":
      return "identifier";
    case "Number":
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
    case "as":
    case "hint":
    case "materialized":
    case "range":
    case "from":
    case "to":
    case "step":
    case "mv-expand":
    case "make-series":
    case "join":
    case "lookup":
    case "parse":
    case "datatable":
    case "print":
    case "evaluate":
    case "partition":
    case "sample":
    case "getschema":
    case "render":
    case "serialize":
    case "set":
    case "declare":
    case "query_parameters":
    case "with":
    case "on":
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
