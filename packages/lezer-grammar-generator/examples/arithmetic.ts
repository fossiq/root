import {
  generateLezerGrammar,
  repeat,
  seq,
  ref,
  regex,
  type GrammarDefinition,
} from "../src/index.js";

const def: GrammarDefinition = {
  name: "Arithmetic",
  top: "expr",
  tokens: [
    { name: "Number", pattern: regex("[0-9]+") },
    { name: "Plus", pattern: regex("\\+") },
    { name: "Star", pattern: regex("\\*") },
  ],
  precedence: [
    { name: "multiply", associativity: "left" },
    { name: "add", associativity: "left" },
  ],
  rules: {
    expr: { expression: ref("addExpr") },
    addExpr: {
      expression: seq(
        ref("mulExpr"),
        repeat(seq(ref("Plus"), ref("mulExpr")), "*"),
      ),
    },
    mulExpr: {
      expression: seq(
        ref("primary"),
        repeat(seq(ref("Star"), ref("primary")), "*"),
      ),
    },
    primary: { expression: ref("Number") },
  },
};

console.log(generateLezerGrammar(def));
