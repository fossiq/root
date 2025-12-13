import { describe, test, expect } from "bun:test";
import { parser } from "../src/parser";

function canParse(source: string): boolean {
  const tree = parser.parse(source);
  const cursor = tree.cursor();
  do {
    if (cursor.type.name === "⚠") {
      return false;
    }
  } while (cursor.next());
  return true;
}

describe("project-* operators", () => {
  const cases = [
    ["project-away", "Users | project-away Secret, Password"],
    ["project-keep", "Users | project-keep Name, Email"],
    ["project-rename", "Users | project-rename DisplayName = Name, Alias = Email"],
    ["project-reorder", "Users | project-reorder Email, Name"],
  ] as const;

  for (const [label, query] of cases) {
    test(`${label} clause parses`, () => {
      expect(canParse(query)).toBe(true);
    });
  }
});
