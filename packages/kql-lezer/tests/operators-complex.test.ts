import { describe, test, expect } from "bun:test";
import { isValid } from "./_helpers";

describe("Complex chained queries", () => {
  test("where + sort + limit", () => {
    expect(isValid("Users | where age > 18 | sort by name | limit 10")).toBe(
      true
    );
  });

  test("where + summarize + sort", () => {
    expect(
      isValid(
        'Events | where type == "error" | summarize count() by Source | sort by count desc'
      )
    ).toBe(true);
  });
});
