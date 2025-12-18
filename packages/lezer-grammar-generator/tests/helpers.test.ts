import { describe, expect, test } from "bun:test";
import {
  choice,
  group,
  kw,
  kwRenamed,
  many,
  many1,
  opt,
  separatedList,
  seq,
} from "../src/helpers.js";

describe("helpers", () => {
  test("seq joins with spaces and skips falsy", () => {
    expect(seq("a", undefined, "b", false, "c")).toBe("a b c");
  });

  test("choice joins with pipes and skips falsy", () => {
    expect(choice("Number", null, "String")).toBe("Number | String");
  });

  test("group wraps in parens", () => {
    expect(group("a b")).toBe("(a b)");
  });

  test("opt groups when needed", () => {
    expect(opt("Identifier")).toBe("Identifier?");
    expect(opt("a b")).toBe("(a b)?");
    expect(opt("(a b)")).toBe("(a b)?");
  });

  test("many/many1 group when needed", () => {
    expect(many("Identifier")).toBe("Identifier*");
    expect(many("a b")).toBe("(a b)*");
    expect(many1("Identifier")).toBe("Identifier+");
    expect(many1("a b")).toBe("(a b)+");
  });

  test("separatedList emits common list patterns", () => {
    expect(separatedList("identifier", "Comma")).toBe(
      "identifier (Comma identifier)*"
    );
    expect(separatedList("identifier", "Comma", { min: 0 })).toBe(
      "(identifier (Comma identifier)*)?"
    );
  });

  test("kw helpers emit macro invocations with quoted terms", () => {
    expect(kw("where")).toBe('kw<"where">');
    expect(kwRenamed("!in", "NotIn")).toBe('kwRenamed<"!in", "NotIn">');
  });
});
