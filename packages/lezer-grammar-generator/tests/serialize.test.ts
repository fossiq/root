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

  test("serializes local tokens", () => {
    const def: GrammarDefinition = {
      tokens: [{ name: "GlobalToken", pattern: raw('"global"') }],
      localTokens: [
        { name: "LocalToken", pattern: raw('"local"') },
        { name: "AnotherLocal", pattern: regex("[a-z]+") },
      ],
      rules: {
        start: { expression: choice(ref("GlobalToken"), ref("LocalToken")) },
      },
    };

    const grammar = generateLezerGrammar(def);

    expect(grammar).toContain(`@tokens {
  GlobalToken { "global" }
}

@local tokens {
  AnotherLocal { $[a-z]+ }
  LocalToken { "local" }
}`);
  });

  test("serializes macros block", () => {
    const def: GrammarDefinition = {
      tokens: [{ name: "Identifier", pattern: regex("[A-Za-z]+") }],
      macros: {
        "kw<term>": {
          params: ["term"],
          expression: raw("@specialize[@name={term}]<Identifier, term>"),
        },
      },
      rules: {
        start: { expression: ref("Identifier") },
      },
    };

    const grammar = generateLezerGrammar(def);

    expect(grammar).toContain(`@macros {
  kw<term> { @specialize[@name={term}]<Identifier, term> }
}`);
  });
});
