import type { ParseResult } from "@fossiq/kql-ast";
import { parser } from "./parser";
import { cstToAst } from "./parser/cst-to-ast";
import { parseErrors } from "./errors";
import { extractHighlightTokens } from "./highlight";

export { parseErrors, extractHighlightTokens };

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
