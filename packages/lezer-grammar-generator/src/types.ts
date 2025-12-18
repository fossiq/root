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
}

/**
 * AST type definition
 */
export interface ASTTypeDefinition {
  /**
   * Type name in the grammar
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
export interface TokenDefinition {
  /**
   * Token name
   */
  name: string;

  /**
   * Token pattern in Lezer grammar format
   */
  pattern: string;

  /**
   * Whether this is a specialized token (like @specialize)
   */
  specialized?: {
    base: string;
    term: string;
  };
}

/**
 * Generated grammar result
 */
export interface GeneratedGrammar {
  grammar: string;
  imports: string[];
  errors: string[];
}
