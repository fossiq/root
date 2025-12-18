import { describe, test, expect } from "bun:test";
import { isValid } from "./_helpers";

describe("DateTime literals", () => {
  test("ISO 8601 format", () => {
    // Using extend since print is not yet supported
    expect(isValid("Events | extend d = datetime(2024-01-01)")).toBe(true);
    expect(isValid("Events | extend d = datetime(2024-01-01T12:00:00Z)")).toBe(
      true
    );
  });

  test("in filter clause", () => {
    expect(isValid("Events | where Timestamp > datetime(2024-01-01)")).toBe(
      true
    );
    expect(
      isValid("Events | where Timestamp < datetime(2023-12-31T23:59:59.999Z)")
    ).toBe(true);
  });

  test("date alias", () => {
    expect(isValid("Events | where d == date(2024-01-01)")).toBe(true);
  });
});

describe("Guid literals", () => {
  test("standard format", () => {
    expect(
      isValid("Events | where Id == guid(74be27de-1e4e-49d9-b579-fe0b331d3642)")
    ).toBe(true);
  });

  test("with uppercase", () => {
    expect(
      isValid("Events | where Id == guid(74BE27DE-1E4E-49D9-B579-FE0B331D3642)")
    ).toBe(true);
  });
});
