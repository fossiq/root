import { describe, expect, test } from "bun:test";
import {
  ref,
  regex,
  type GrammarDefinition,
  validateGrammar,
} from "../src/index.js";

describe("validateGrammar", () => {
  test("detects missing refs and arity mismatches", () => {
    const def: GrammarDefinition = {
      name: "Query",
      top: "statement",
      rules: {
        statement: { expression: ref("missing") },
        expr: { params: ["T"], expression: ref("expr") },
      },
    };

    const result = validateGrammar(def);
    const messages = result.issues.map((issue) => issue.message).join("\n");

    expect(result.ok).toBe(false);
    expect(messages).toContain("Unknown reference 'missing'");
    expect(messages).toContain("expects 1 args but got 0");
  });

  test("warns on cycles and unused rules", () => {
    const def: GrammarDefinition = {
      name: "Query",
      top: "a",
      rules: {
        a: { expression: ref("b") },
        b: { expression: ref("a") },
        c: { expression: ref("a") },
      },
    };

    const result = validateGrammar(def);
    const warnings = result.issues.filter((issue) => issue.level === "warning");

    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings.map((w) => w.code)).toContain("rules.cycle");
    expect(warnings.map((w) => w.code)).toContain("rules.unused");
  });

  test("flags invalid identifiers", () => {
    const def: GrammarDefinition = {
      name: "Bad-Name",
      top: "123bad",
      tokens: [{ name: "123Token", pattern: regex("x") }],
      rules: {
        "123bad": { expression: ref("Identifier") },
      },
    };

    const result = validateGrammar(def);
    const errors = result.issues.filter((issue) => issue.level === "error");

    expect(errors.map((e) => e.code)).toContain("name.invalid");
    expect(errors.map((e) => e.code)).toContain("rule.invalidName");
    expect(errors.map((e) => e.code)).toContain("token.invalidName");
  });

  test("validates local tokens", () => {
    const def: GrammarDefinition = {
      tokens: [{ name: "GlobalToken", pattern: regex("g") }],
      localTokens: [
        { name: "LocalToken", pattern: regex("l") },
        { name: "123Bad", pattern: regex("b") }, // invalid name
        { name: "LocalToken", pattern: regex("dup") }, // duplicate
      ],
      dialects: ["dialect1"],
      rules: {
        start: { expression: ref("GlobalToken") },
      },
    };

    const result = validateGrammar(def);
    const errors = result.issues.filter((issue) => issue.level === "error");

    expect(errors.map((e) => e.code)).toContain("token.invalidName");
    expect(errors.map((e) => e.code)).toContain("token.duplicate");
  });

  test("detects local token name conflicts", () => {
    const def: GrammarDefinition = {
      tokens: [{ name: "Conflict", pattern: regex("c") }],
      localTokens: [{ name: "Conflict", pattern: regex("l") }],
      rules: {
        start: { expression: ref("Conflict") },
      },
    };

    const result = validateGrammar(def);
    const errors = result.issues.filter((issue) => issue.level === "error");

    expect(errors.map((e) => e.code)).toContain("name.duplicate");
  });

  test("validates local token dialects", () => {
    const def: GrammarDefinition = {
      localTokens: [{ name: "Local", pattern: regex("l"), dialect: "unknown" }],
      rules: {
        start: { expression: ref("Local") },
      },
    };

    const result = validateGrammar(def);
    const errors = result.issues.filter((issue) => issue.level === "error");

    expect(errors.map((e) => e.code)).toContain("dialect.unknown");
  });
});
