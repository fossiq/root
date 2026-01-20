import { describe, test, expect } from "bun:test";
import { isValid } from "./_helpers";

describe("Between operator", () => {
  test("between literal numbers", () => {
    expect(isValid("Events | where Value between (1 .. 10)")).toBe(true);
    expect(isValid("Events | where Value !between (1 .. 10)")).toBe(true);
  });

  test("between timespans", () => {
    expect(isValid("Events | where Duration between (1m .. 1h)")).toBe(true);
  });

  test("between datetimes", () => {
    expect(
      isValid(
        "Events | where Timestamp between (datetime(2023-01-01) .. datetime(2023-12-31))"
      )
    ).toBe(true);
  });

  test("between expressions", () => {
    expect(isValid("Events | where Timestamp between (ago(7d) .. now())")).toBe(
      true
    );
  });
});

describe("Union operator", () => {
  test("simple union", () => {
    expect(isValid("union Table1, Table2")).toBe(true);
    expect(isValid("Table1 | union Table2")).toBe(true);
  });

  test("union with kind", () => {
    expect(isValid("union kind=inner Table1, Table2")).toBe(true);
    expect(isValid("union kind=outer Table1, Table2")).toBe(true);
  });

  test("union with source", () => {
    expect(isValid("union withsource=Source Table1, Table2")).toBe(true);
  });

  test("complex union", () => {
    expect(
      isValid("union kind=inner withsource=Src Table1, Table2, Table3")
    ).toBe(true);
  });
});

describe("Search operator", () => {
  test("simple search", () => {
    expect(isValid('search "error"')).toBe(true);
  });

  test("search multiple terms", () => {
    expect(isValid('search "error" or "warning"')).toBe(true);
  });

  test("search in specific tables", () => {
    expect(isValid('search in (Table1, Table2) "error"')).toBe(true);
  });

  test("search with kind", () => {
    expect(isValid('search kind=case_sensitive "Error"')).toBe(true);
  });
});

describe("Find operator", () => {
  test("simple find", () => {
    expect(isValid('find "error"')).toBe(true);
  });

  test("find in tables", () => {
    expect(isValid('find in (Table1, Table2) "error"')).toBe(true);
  });

  test("find with kind", () => {
    expect(isValid('find kind=case_sensitive in (Table1) "Error"')).toBe(true);
  });
});
