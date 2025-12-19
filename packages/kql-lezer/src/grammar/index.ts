import type { GrammarDefinition } from "@fossiq/lezer-grammar-generator";
import coreGrammar from "./plugins/core";

/**
 * Main grammar definition for KQL.
 *
 * Currently uses a single core grammar definition.
 * Future extensions will add additional grammar modules
 * following the plugin architecture pattern.
 *
 * Current approach:
 * - Use GrammarDefinition (model-based API) for type safety
 * - Organize tokens and rules in small, focused files
 * - Keep plugin pattern for organization but merge at build time
 *
 * Future extensions:
 * - Create separate GrammarDefinition objects per feature group
 * - Merge them using a custom merge function
 * - Preserve dependency tracking and modular development
 */
export const grammarDefinition: GrammarDefinition = coreGrammar;

/**
 * Export for inspection and testing
 */
export { coreGrammar };
