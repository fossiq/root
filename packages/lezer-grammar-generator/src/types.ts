import type { ValidationIssue } from "./model.js";

/**
 * Configuration for generating Lezer grammar
 */
export interface GrammarGeneratorConfig {
  /**
   * Name of the grammar
   */
  grammarName: string;

  /**
   * AST types to generate grammar from
   */
  astTypes: {
    [typeName: string]: ASTTypeDefinition;
  };

  /**
   * Custom token definitions
   */
  tokens?: TokenDefinition[];

  /**
   * Skip whitespace rule
   */
  skipWhitespace?: boolean;

  /**
   * Token precedence list (names of tokens in order)
   */
  precedence?: string[];

  /**
   * Grammar macros (e.g., "kw<term>": "{ @specialize[@name={term}]<Identifier, term> }")
   */
  macros?: {
    [name: string]: string;
  };

  /**
   * Validation options for passthrough strings (e.g. `grammarFields`, token patterns, macros).
   *
   * - `off`: no passthrough validation (only required-field checks still apply)
   * - `basic` (default): balanced delimiters/quotes + macro invocation checks
   * - `strict`: additionally attempts to detect unknown rule/token/macro references
   */
  validation?: {
    mode?: "off" | "basic" | "strict";
    /**
     * Allowlist for strict-mode unknown reference checks.
     * Useful when referencing external constructs not modeled by this generator.
     */
    allowUnknown?: string[];
  };
}

export interface GrammarPlugin {
  name: string;
  dependsOn?: string[];
  tokens?: TokenDefinition[];
  rules?: Record<string, string>;
  precedence?: string[];
  macros?: Record<string, string>;
  skipWhitespace?: boolean;
}

export interface PluginGrammarConfig {
  grammarName: string;
  plugins: GrammarPlugin[];
  precedence?: string[];
  skipWhitespace?: boolean;
  validation?: GrammarGeneratorConfig["validation"];
}

/**
 * AST type definition
 */
export interface ASTTypeDefinition {
  /**
   * Rule name in the grammar
   */
  grammarName: string;

  /**
   * Fields definition in grammar format
   * e.g., "{ kw<\"let\"> identifier Equals expression Semicolon }"
   */
  grammarFields: string;

  /**
   * Whether this is a rule that produces children
   */
  isRule?: boolean;

  /**
   * Precedence group
   */
  precedence?: number;
}

/**
 * Token definition
 */
export type TokenDefinition =
  | {
      /**
       * Token name
       */
      name: string;

      /**
       * Token pattern in Lezer grammar format
       */
      pattern: string;
    }
  | {
      /**
       * Token name
       */
      name: string;

      /**
       * Whether this is a specialized token (like @specialize)
       */
      specialized: {
        base: string;
        term: string;
      };
    };

/**
 * Generated grammar result
 */
export interface GeneratedGrammar {
  grammar: string;
  imports: string[];
  errors: readonly ValidationIssue[];
}
