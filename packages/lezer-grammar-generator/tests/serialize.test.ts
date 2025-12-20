import { describe, expect, test } from "bun:test";
import {
  generateLezerGrammar,
  choice,
  ref,
  regex,
  raw,
  type GrammarDefinition,
} from "../src/index.js";

describe("generateLezerGrammar", () => {
  test("serializes a grammar deterministically", () => {
    const def: GrammarDefinition = {
      name: "Query",
      top: "statement",
      tokens: [
        { name: "Number", pattern: regex("[0-9]+") },
        { name: "Identifier", pattern: regex("[A-Za-z_][A-Za-z0-9_]*") },
        { name: "Equals", pattern: raw('"="') },
      ],
      externals: ["ExternalToken"],
      precedence: [
        { name: "mult", associativity: "left" },
        { name: "assign", associativity: "right" },
      ],
      rules: {
        statement: { expression: ref("expr", ["T"]) },
        expr: {
          params: ["T"],
          props: { kind: "expr", prec: 1 },
          expression: choice(ref("Number"), ref("Identifier")),
        },
      },
    };

    const grammar = generateLezerGrammar(def);

    expect(grammar).toBe(`@tokens {
  Equals { "=" }
  Identifier { $[A-Za-z_]$[A-Za-z0-9_]* }
  Number { @digit+ }
}

@external tokens {
  ExternalToken
}

@precedence {
  left mult;
  right assign;
}

@top Query { statement }

statement { expr<T> }

expr<T>[kind="expr", prec=1] { Number | Identifier }
`);
  });
});
