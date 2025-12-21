import type { GrammarDefinition } from "@fossiq/lezer-grammar-generator";
import { allTokens } from "./tokens";
import { allRules } from "./rules";

/**
 * Core KQL Grammar Definition
 *
 * Foundational grammar for KQL (Kusto Query Language) parser including:
 * - Core tokens (identifiers, numbers, strings, operators, delimiters)
 * - Pipeline structure with pipe operator for chaining operations
 * - Let statements for variable assignments
 * - Where clause for filtering operators
 * - Basic scalar expressions (arithmetic and comparison operations)
 *
 * Token categories organized for maintainability:
 * - Delimiters: parentheses, brackets, pipe, commas, semicolons
 * - Operators: arithmetic (+, -, *, /, %) and comparisons (==, !=, >, <, >=, <=)
 * - Literals: identifiers, numbers, strings (multiple formats), datetime, timespan, GUID
 * - Keywords: multi-word operators (project-*, mv-expand) and negation operators (!between, !contains, !has, !in)
 * - Comments & Whitespace: line comments (//) and whitespace handling
 *
 * Leverages lezer-grammar-generator features:
 * - Type-safe grammar definitions (GrammarDefinition)
 * - Macro system for keyword specialization (kw<term>)
 * - Pattern expressions (regex, literal, choice, seq, etc.)
 * - Organized plugin structure for modular development
 *
 * Features implemented:
 * - core.tokens: All token definitions
 * - core.identifiers: Identifier pattern matching
 * - core.pipe: Pipeline structure
 * - core.let-statement: Variable assignments
 * - operator.where: Filtering operations
 * - scalar.arithmetic: Addition and subtraction
 * - scalar.comparison: Relational operations
 */
export const coreGrammar: GrammarDefinition = {
  name: "KQL",
  top: "Query",
  tokens: allTokens,
  rules: allRules,
  precedence: [],
  macros: {
    kw: {
      params: ["term"],
      expression: {
        type: "raw",
        content: "@specialize[@name={term}]<Identifier, {term}>",
      },
    },
  },
};

export default coreGrammar;
