import { describe, expect, it } from "bun:test";
import { generateLezerGrammar } from "../src/serialize.js";
import { validateGrammar } from "../src/validate.js";
import type { GrammarDefinition } from "../src/model.js";

describe("skip blocks", () => {
  it("serializes global @skip block", () => {
    const def: GrammarDefinition = {
      name: "test",
      top: "Program",
      skip: { type: "ref", name: "space" },
      rules: {
        Program: { expression: { type: "ref", name: "Word" } },
      },
      tokens: [
        { name: "space", pattern: { type: "regex", pattern: /\s+/ } },
        { name: "Word", pattern: { type: "regex", pattern: /\w+/ } },
      ],
    };

    const output = generateLezerGrammar(def);
    expect(output).toContain("@skip { space }");
  });

  it("serializes per-rule @skip block", () => {
    const def: GrammarDefinition = {
      name: "test",
      top: "Program",
      rules: {
        Program: {
          expression: { type: "ref", name: "String" },
        },
        String: {
          expression: { type: "ref", name: "stringContent" },
          skip: { type: "choice", alternatives: [] },
        },
      },
      tokens: [
        { name: "stringContent", pattern: { type: "regex", pattern: /[^"]+/ } },
      ],
    };

    const output = generateLezerGrammar(def);
    expect(output).toContain("@skip {  } {\n  String { stringContent }\n}");
  });

  it("validates unknown reference in global skip", () => {
    const def: GrammarDefinition = {
      name: "test",
      top: "Program",
      skip: { type: "ref", name: "unknown" },
      rules: {
        Program: { expression: { type: "literal", value: "a" } },
      },
    };

    const result = validateGrammar(def);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === "skip.unknown")).toBe(true);
  });

  it("validates unknown reference in rule skip", () => {
    const def: GrammarDefinition = {
      name: "test",
      top: "Program",
      rules: {
        Program: {
          expression: { type: "literal", value: "a" },
          skip: { type: "ref", name: "unknown" },
        },
      },
    };

    const result = validateGrammar(def);
    expect(result.ok).toBe(false);
    expect(result.issues.some((i) => i.code === "skip.unknown")).toBe(true);
  });
});
