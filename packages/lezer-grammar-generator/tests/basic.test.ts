import { describe, expect, test } from "bun:test";
import { generateGrammar } from "../src/generator.js";
import type { GrammarGeneratorConfig } from "../src/types.js";

describe("lezer-grammar-generator", () => {
  test("generates basic grammar", () => {
    const config: GrammarGeneratorConfig = {
      grammarName: "TestGrammar",
      astTypes: {
        statement: {
          grammarName: "statement",
          grammarFields: "letStatement | queryExpression",
          isRule: true
        },
        letStatement: {
          grammarName: "letStatement",
          grammarFields: 'kw<"let"> identifier Equals expression Semicolon',
          isRule: true
        },
        queryExpression: {
          grammarName: "queryExpression",
          grammarFields: "identifier (Pipe operator)*",
          isRule: true
        },
        expression: {
          grammarName: "expression",
          grammarFields: "binaryExpression | literal | identifier",
          isRule: true,
          precedence: 1
        },
        binaryExpression: {
          grammarName: "binaryExpression",
          grammarFields: "expression ComparisonOp expression",
          isRule: true,
          precedence: 2
        }
      },
      tokens: [
        {
          name: "MySpecialToken",
          pattern: "",
          specialized: {
            base: "Identifier",
            term: "mySpecial"
          }
        }
      ]
    };

    const result = generateGrammar(config);
    
    expect(result.grammar).toContain("@top TestGrammar { statement }");
    expect(result.grammar).toContain("statement { letStatement | queryExpression }");
    expect(result.grammar).toContain('letStatement { kw<"let"> identifier Equals expression Semicolon }');
    expect(result.grammar).toContain("Identifier { $[a-zA-Z_] $[a-zA-Z0-9_]* }");
    expect(result.grammar).toContain("@skip { whitespace | LineComment }");
    expect(result.errors).toEqual([]);
  });

  test("handles missing start rule", () => {
    const config: GrammarGeneratorConfig = {
      grammarName: "TestGrammar",
      astTypes: {
        expression: {
          grammarName: "expression",
          grammarFields: "literal",
          isRule: true
        }
      }
    };

    const result = generateGrammar(config);
    
    expect(result.grammar).toContain("@top TestGrammar { expression }");
  });

  test("generates precedence section", () => {
    const config: GrammarGeneratorConfig = {
      grammarName: "TestGrammar",
      astTypes: {
        statement: {
          grammarName: "statement",
          grammarFields: "expression",
          isRule: true
        },
        expression: {
          grammarName: "expression",
          grammarFields: "binaryExpression",
          isRule: true,
          precedence: 1
        },
        binaryExpression: {
          grammarName: "binaryExpression",
          grammarFields: "expression Plus expression",
          isRule: true,
          precedence: 2
        }
      }
    };

    const result = generateGrammar(config);
    
    expect(result.grammar).toContain("@precedence {");
    expect(result.grammar).toContain("expression,");
    expect(result.grammar).toContain("binaryExpression,");
  });
});