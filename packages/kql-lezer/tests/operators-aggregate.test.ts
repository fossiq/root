import { describe, test, expect } from "bun:test";
import { isValid } from "./_helpers";

describe("mv-expand operator", () => {
  test("mv-expand clause parses", () => {
    expect(isValid("Events | mv-expand Values")).toBe(true);
    expect(isValid("Events | mv-expand Values, MoreValues")).toBe(true);
  });
});

describe("Distinct operator", () => {
  test("single column", () => {
    expect(isValid("Events | distinct EventType")).toBe(true);
  });

  test("multiple columns", () => {
    expect(isValid("Events | distinct EventType, Source")).toBe(true);
  });
});

describe("Summarize operator", () => {
  test("simple aggregation", () => {
    expect(isValid("Events | summarize count()")).toBe(true);
  });

  test("aggregation with by clause", () => {
    expect(isValid("Events | summarize count() by EventType")).toBe(true);
  });

  test("aggregation with alias", () => {
    expect(isValid("Events | summarize total = sum(Amount) by Category")).toBe(
      true
    );
  });

  test("multiple aggregations", () => {
    expect(
      isValid("Events | summarize count(), avg(Duration) by EventType, Source")
    ).toBe(true);
  });
});
