import type { GrammarDefinition } from "@fossiq/lezer-grammar-generator";
import coreGrammar from "./plugins/core";

/**
 * Main grammar definition for KQL (Kusto Query Language).
 *
 * This module exports the complete grammar definition used to generate
 * the Lezer parser. It organizes all tokens and rules in a modular structure.
 *
 * Architecture:
 * - Uses GrammarDefinition (model-based API) for type safety and consistency
 * - Organizes tokens and rules in small, focused files for maintainability
 * - Leverages lezer-grammar-generator features for efficient pattern matching
 *
 * Module structure:
 * - plugins/core.ts: Main grammar definition merging all components
 * - plugins/tokens/: Token definitions organized by category
 *   - delimiters.ts: Parentheses, brackets, punctuation
 *   - operators.ts: Arithmetic and comparison operators
 *   - literals.ts: Identifiers, numbers, strings, literals
 *   - keywords.ts: Multi-word and special operators
 *   - whitespace.ts: Comments and whitespace
 * - plugins/rules/: Grammar rules for syntax structures
 * - plugins/tokens/index.ts: Token aggregation
 * - plugins/rules/index.ts: Rule aggregation
 *
 * Supported features from lezer-grammar-generator:
 * ✅ Type-safe grammar definitions with branded types
 * ✅ Pattern expressions (regex, literal, seq, choice, group, repeat, optional)
 * ✅ Macro system for specialized tokens (kw<term>)
 * ✅ Validation and error reporting
 * ✅ Multiple regex patterns for efficient token matching
 *
 * Generation process:
 * 1. Generate grammar from this TypeScript definition
 * 2. Parse generated .grammar file with Lezer generator
 * 3. Generate parser.ts with term definitions and parsing rules
 * 4. Apply type fixes to ensure compatibility with AST definitions
 *
 * Future enhancements:
 * - Additional operators (between, contains, has, in with full variants)
 * - More complete expression grammar with proper precedence
 * - Aggregation operators (summarize, group by, etc.)
 * - Join operators and complex queries
 * - Distinct and top operators with full syntax
 * - Function calls and nested expressions
 */
export const grammarDefinition: GrammarDefinition = coreGrammar;

/**
 * Export for inspection and testing
 */
export { coreGrammar };
