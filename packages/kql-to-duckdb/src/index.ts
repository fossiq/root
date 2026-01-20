import { parseKQL } from "@fossiq/kql-lezer";
import type { Query, ParseError } from "@fossiq/kql-ast";
import { translate } from "./translator";

export { translate };

/**
 * Parse KQL query using Lezer parser
 */
export function parseKql(query: string): Query {
  const result = parseKQL(query);

  if (!result.ast) {
    throw new Error("Failed to parse KQL query");
  }

  if (result.errors.length > 0) {
    const errorMessages = result.errors.map((e: ParseError) => e.message).join(", ");
    console.warn(`Parse errors: ${errorMessages}`);
  }

  return result.ast;
}

/**
 * Convert KQL query to DuckDB SQL
 */
export function kqlToDuckDB(query: string): string {
  const ast = parseKql(query);
  return translate(ast);
}
