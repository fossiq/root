import type { GrammarDefinition } from "@fossiq/lezer-grammar-generator";
import { allTokens } from "./tokens";
import { allRules } from "./rules";

/**
 * Core KQL Grammar Definition
 *
 * Foundational grammar for KQL parser including:
 * - Core tokens (identifiers, numbers, strings, operators)
 * - Pipeline structure with pipe operator
 * - Let statements
 * - Where clause (filtering operator)
 * - Basic scalar expressions (arithmetic and comparison)
 *
 * All tokens and rules are organized in small, focused files
 * under ./tokens/ and ./rules/ directories.
 *
 * Features implemented:
 * - core.tokens
 * - core.identifiers
 * - core.pipe
 * - core.let-statement
 * - operator.where
 * - scalar.arithmetic
 * - scalar.comparison
 */
export const coreGrammar: any = {
    name: "KQL",
    top: "Query",
    tokens: allTokens,
    rules: allRules,
    precedence: [],
    macros: {
        "kw<term>": "@specialize[@name={term}]<Identifier, term>",
    },
};

export default coreGrammar;
