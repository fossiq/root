import type { ParseError } from "@fossiq/kql-ast";
import { parser } from "./parser";
import { walkTree } from "./parse-utils";

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
