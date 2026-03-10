import { describe, expect, test } from "bun:test";
import {
  serializePattern,
  convertRegexToLezer,
} from "../src/serialization/pattern-serialize.js";
import { regex, ref, seq, choice } from "../src/helpers.js";

describe("serializePattern with multiple regex patterns", () => {
  test("serializes single string pattern", () => {
    const pattern = regex("[a-z]+");
    expect(serializePattern(pattern)).toBe("$[a-z]+");
  });

  test("serializes single RegExp pattern", () => {
    const pattern = regex(/[a-z]+/);
    expect(serializePattern(pattern)).toBe("$[a-z]+");
  });

  test("serializes multiple string patterns with | separator", () => {
    const patterns = regex(["[a-z]+", "[A-Z]+"]);
    expect(serializePattern(patterns)).toBe("$[a-z]+ | $[A-Z]+");
  });

  test("serializes multiple RegExp patterns with | separator", () => {
    const patterns = regex([/[a-z]+/, /[A-Z]+/]);
    expect(serializePattern(patterns)).toBe("$[a-z]+ | $[A-Z]+");
  });

  test("serializes mixed string and RegExp patterns", () => {
    const patterns = regex(["[0-9]+", /[a-z]+/, "[A-Z]+"]);
    expect(serializePattern(patterns)).toBe(
      "$[0-9]+ | $[a-z]+ | $[A-Z]+",
    );
  });

  test("serializes multiple patterns with digit conversions", () => {
    const patterns = regex(["\\d+", "[A-Za-z]+"]);
    expect(serializePattern(patterns)).toBe("$[0-9]+ | $[A-Za-z]+");
  });

   test.skip("serializes complex patterns with multiple alternatives", () => {
     const patterns = regex([
       "0x[0-9a-fA-F]+",
       "[0-9]+\\.[0-9]+",
       "[0-9]+",
     ]);
     expect(serializePattern(patterns)).toBe(
       "0x$[0-9a-fA-F]+ | \"@digit+\\\".\\\"@digit+\" | @digit+",
     );
   });

  test("handles empty array gracefully", () => {
    const patterns = regex([]);
    expect(serializePattern(patterns)).toBe("");
  });

  test("single pattern in array is serialized correctly", () => {
    const patterns = regex(["[a-z]+"]);
    expect(serializePattern(patterns)).toBe("$[a-z]+");
  });

  test("preserves spacing in choice serialization", () => {
    const patterns = regex(["a", "b", "c"]);
    expect(serializePattern(patterns)).toBe('a | b | c');
  });

  test("works in context with other expressions", () => {
    const expr = seq(regex(["[a-z]+", "[A-Z]+"]), ref("Rest"));
    const result = serializePattern(expr);
    expect(result).toBe("$[a-z]+ | $[A-Z]+ Rest");
  });

  test("serializes in choice expression with multiple patterns", () => {
    const expr = choice(
      regex(["[a-z]+", "[A-Z]+"]),
      regex("[0-9]+"),
    );
    const result = serializePattern(expr);
    // Multiple regex patterns already use |, so they flatten in choice
    expect(result).toBe("$[a-z]+ | $[A-Z]+ | $[0-9]+");
  });
});

describe("convertRegexToLezer with multiple patterns", () => {
  test("converts common character classes", () => {
    expect(convertRegexToLezer("[a-z]+")).toBe("$[a-z]+");
    expect(convertRegexToLezer("[0-9]+")).toBe("$[0-9]+");
    expect(convertRegexToLezer("\\d+")).toBe("$[0-9]+");
  });

  test("handles negated character classes", () => {
    expect(convertRegexToLezer("[^a-z]")).toBe("![a-z]");
  });

  test("converts ASCII letter patterns", () => {
    expect(convertRegexToLezer("[a-zA-Z]")).toBe("$[a-zA-Z]");
  });

  test.skip("handles backslash escaping", () => {
    expect(convertRegexToLezer("\\\\")).toBe("\\\\\\\\");
  });

  test.skip("handles quotes in patterns by quoting and escaping", () => {
    expect(convertRegexToLezer('a"b')).toBe('"a\\"b"');
  });
});
