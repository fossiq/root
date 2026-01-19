import type { ParseResult } from "@fossiq/kql-ast";
import { parser } from "./parser";
import { cstToAst } from "./parser/cst-to-ast";
import { parseErrors } from "./errors";
import { extractHighlightTokens } from "./highlight";
import { LRLanguage, LanguageSupport } from "@codemirror/language";
import { styleTags, tags as t } from "@lezer/highlight";

export { parseErrors, extractHighlightTokens };

// Define the KQL language for CodeMirror
export const kqlLanguage = LRLanguage.define({
  parser: parser.configure({
    props: [
      styleTags({
        Identifier: t.variableName,
        Number: t.number,
        String: t.string,
        LineComment: t.lineComment,
        "where project extend sort limit take top distinct summarize join union search find": t.keyword,
        "let set": t.definitionKeyword,
        "and or not": t.logicOperator,
        "contains startswith endswith has in matches regex": t.operatorKeyword,
        ComparisonOp: t.compareOperator,
        "Plus Minus Star Slash Percent": t.arithmeticOperator,
        Equals: t.definitionOperator,
        "OpenParen CloseParen": t.paren,
        "OpenBracket CloseBracket": t.squareBracket,
        Comma: t.separator,
        Semicolon: t.separator,
        Pipe: t.punctuation,
      }),
    ],
  }),
  languageData: {
    commentTokens: { line: "//" },
  },
});

/**
 * Initialize KQL language support for CodeMirror
 */
export function kql() {
  return new LanguageSupport(kqlLanguage);
}

/**
 * Parse KQL and return both AST and highlight tokens.
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
        start: result.from,
        end: result.to,
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
