import { describe, expect, test } from "bun:test";
import {
  generateGrammarFromPlugins,
  type GrammarPlugin,
} from "../src/index.js";

describe("lezer-grammar-generator plugins", () => {
  test("merges plugins with dependencies", () => {
    const core: GrammarPlugin = {
      name: "core",
      rules: {
        query: "Identifier",
      },
    };

    const wherePlugin: GrammarPlugin = {
      name: "where",
      dependsOn: ["core"],
      rules: {
        whereClause: 'kw<"where"> Identifier',
      },
      macros: {
        "kw<term>": "@specialize[@name={term}]<Identifier, term>",
      },
    };

    const result = generateGrammarFromPlugins({
      grammarName: "Query",
      plugins: [wherePlugin, core],
    });

    expect(result.errors).toEqual([]);
    expect(result.grammar).toContain("@top Query { query }");
    expect(result.grammar).toContain('whereClause { kw<"where"> Identifier }');
  });

  test("detects missing dependencies", () => {
    const plugin: GrammarPlugin = {
      name: "missing-dep",
      dependsOn: ["nope"],
      rules: { query: "Identifier" },
    };

    const result = generateGrammarFromPlugins({
      grammarName: "Query",
      plugins: [plugin],
    });

    expect(result.errors.join("\n")).toContain(
      "depends on missing plugin 'nope'",
    );
  });

  test("detects duplicate rule names", () => {
    const a: GrammarPlugin = {
      name: "a",
      rules: { query: "Identifier" },
    };
    const b: GrammarPlugin = {
      name: "b",
      rules: { query: "Number" },
    };

    const result = generateGrammarFromPlugins({
      grammarName: "Query",
      plugins: [a, b],
    });

    expect(result.errors.join("\n")).toContain(
      "Duplicate rule name 'query' across plugins.",
    );
  });

  test("detects cyclic dependencies", () => {
    const a: GrammarPlugin = {
      name: "a",
      dependsOn: ["b"],
      rules: { query: "Identifier" },
    };
    const b: GrammarPlugin = {
      name: "b",
      dependsOn: ["a"],
      rules: { statement: "Identifier" },
    };

    const result = generateGrammarFromPlugins({
      grammarName: "Query",
      plugins: [a, b],
    });

    expect(result.errors.join("\n")).toContain(
      "Cyclic plugin dependency detected",
    );
  });
});
