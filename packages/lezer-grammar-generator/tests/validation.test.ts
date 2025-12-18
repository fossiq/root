import { describe, expect, test } from "bun:test";
import { generateGrammar } from "../src/generator.js";
import type { GrammarGeneratorConfig } from "../src/types.js";

describe("lezer-grammar-generator validation", () => {
  test("rejects invalid grammarName", () => {
    const config: GrammarGeneratorConfig = {
      // @ts-expect-error - intentional invalid input
      grammarName: "123Bad",
      astTypes: {
        statement: { grammarName: "statement", grammarFields: "Identifier", isRule: true },
      },
    };

    const result = generateGrammar(config);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors.join("\n")).toContain("`grammarName` must be a valid identifier");
  });

  test("requires at least one rule", () => {
    const config: GrammarGeneratorConfig = {
      grammarName: "Test",
      astTypes: {
        statement: { grammarName: "statement", grammarFields: "Identifier" },
      },
    };

    const result = generateGrammar(config);
    expect(result.errors.join("\n")).toContain("at least one `astTypes` entry must have `isRule: true`");
  });

  test("detects duplicate token names", () => {
    const config: GrammarGeneratorConfig = {
      grammarName: "Test",
      astTypes: {
        statement: { grammarName: "statement", grammarFields: "Identifier", isRule: true },
      },
      tokens: [
        { name: "X", pattern: '"x"' },
        { name: "X", pattern: '"y"' },
      ],
    };

    const result = generateGrammar(config);
    expect(result.errors.join("\n")).toContain("Duplicate token name 'X'");
  });

  test("detects precedence referencing unknown token", () => {
    const config: GrammarGeneratorConfig = {
      grammarName: "Test",
      astTypes: {
        statement: { grammarName: "statement", grammarFields: "Identifier", isRule: true },
      },
      precedence: ["Identifier", "DoesNotExist"],
    };

    const result = generateGrammar(config);
    expect(result.errors.join("\n")).toContain("`precedence` references unknown token 'DoesNotExist'");
  });

  test("emits specialized tokens with quoted term", () => {
    const config: GrammarGeneratorConfig = {
      grammarName: "Test",
      astTypes: {
        statement: { grammarName: "statement", grammarFields: "Identifier", isRule: true },
      },
      tokens: [
        {
          name: "MySpecial",
          pattern: "",
          specialized: { base: "Identifier", term: "myspecial" },
        },
      ],
    };

    const result = generateGrammar(config);
    expect(result.errors).toEqual([]);
    expect(result.grammar).toContain(
      'MySpecial { @specialize[@name=MySpecial]<Identifier, "myspecial"> }'
    );
  });
});
