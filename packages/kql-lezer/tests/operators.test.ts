import { describe, test, expect } from "vitest";
import { isValid } from "./_helpers";

describe("KQL operators - Basic support", () => {
  test("basic table reference", () => {
    expect(isValid("Users")).toBe(true);
  });

  test("simple numbers and strings", () => {
    expect(isValid("123")).toBe(true);
    expect(isValid('"test"')).toBe(true);
  });

  test("multiple tokens with pipes", () => {
    // Current minimal grammar supports basic token sequences with pipes
    expect(isValid("Users | Events")).toBe(true);
    expect(isValid("Users | 42 | Events")).toBe(true);
  });
});

describe("Pipe operator support", () => {
  test("single pipe with identifiers", () => {
    expect(isValid("Users | Events")).toBe(true);
  });

  test("pipe with numbers", () => {
    expect(isValid("123 | 456")).toBe(true);
  });

  test("pipe with strings", () => {
    expect(isValid('"first" | "second"')).toBe(true);
  });

  test("multiple pipes (chained)", () => {
    expect(isValid("Users | Events | Logs")).toBe(true);
  });

  test("multiple pipes with mixed literals", () => {
    expect(isValid("Users | 42 | Events")).toBe(true);
  });

  test("pipe with complex identifiers", () => {
    expect(isValid("UsersTable | EventsLog")).toBe(true);
  });
});

describe("Operator support (to be expanded)", () => {
  test("future: where operator", () => {
    // Once grammar is expanded
    // expect(isValid("Users | where age > 18")).toBe(true);
  });

  test("future: project operator", () => {
    // Once grammar is expanded
    // expect(isValid("Users | project name")).toBe(true);
  });

  test("future: chained operators", () => {
    // Once grammar is expanded
    // expect(isValid("Users | where age > 18 | project name")).toBe(true);
  });

  test("future: filter operator", () => {
    // Once grammar is expanded
    // expect(isValid("Events | filter severity == 'error'")).toBe(true);
  });

  test("future: summarize operator", () => {
    // Once grammar is expanded
    // expect(isValid("Events | summarize count()")).toBe(true);
  });

  test("future: sort operator", () => {
    // Once grammar is expanded
    // expect(isValid("Users | sort name")).toBe(true);
  });

  test("future: limit operator", () => {
    // Once grammar is expanded
    // expect(isValid("Users | limit 10")).toBe(true);
  });

  test("future: distinct operator", () => {
    // Once grammar is expanded
    // expect(isValid("Events | distinct EventType")).toBe(true);
  });

  test("future: union operator", () => {
    // Once grammar is expanded
    // expect(isValid("Users | union Admin")).toBe(true);
  });
});
