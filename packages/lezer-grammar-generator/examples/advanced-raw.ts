import {
  generateLezerGrammar,
  raw,
  ref,
  regex,
  seq,
  type GrammarDefinition,
} from "../src/index.js";

const def: GrammarDefinition = {
  name: "RawExample",
  top: "statement",
  tokens: [
    { name: "Identifier", pattern: regex("[A-Za-z_][A-Za-z0-9_]*") },
    { name: "Equals", pattern: raw('"="') },
  ],
  rules: {
    statement: {
      expression: seq(ref("Identifier"), ref("Equals"), ref("Identifier")),
    },
  },
};

console.log(generateLezerGrammar(def));
