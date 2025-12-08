/**
 * Tree-sitter grammar type definitions
 * Based on tree-sitter's official grammar DSL types
 */

// Core tree-sitter rule types
export type Rule =
  | StringRule
  | RegexRule
  | SymbolRule
  | ChoiceRule
  | SeqRule
  | RepeatRule
  | Repeat1Rule
  | OptionalRule
  | PrecRule
  | PrecLeftRule
  | PrecRightRule
  | PrecDynamicRule
  | TokenRule
  | AliasRule
  | FieldRule;

export interface StringRule {
  type: 'STRING';
  value: string;
}

export interface RegexRule {
  type: 'PATTERN';
  value: string;
}

export interface SymbolRule {
  type: 'SYMBOL';
  name: string;
}

export interface ChoiceRule {
  type: 'CHOICE';
  members: Rule[];
}

export interface SeqRule {
  type: 'SEQ';
  members: Rule[];
}

export interface RepeatRule {
  type: 'REPEAT';
  content: Rule;
}

export interface Repeat1Rule {
  type: 'REPEAT1';
  content: Rule;
}

export interface OptionalRule {
  type: 'BLANK' | 'CHOICE';
  members?: [Rule, { type: 'BLANK' }];
}

export interface PrecRule {
  type: 'PREC';
  value: number;
  content: Rule;
}

export interface PrecLeftRule {
  type: 'PREC_LEFT';
  value: number;
  content: Rule;
}

export interface PrecRightRule {
  type: 'PREC_RIGHT';
  value: number;
  content: Rule;
}

export interface PrecDynamicRule {
  type: 'PREC_DYNAMIC';
  value: number;
  content: Rule;
}

export interface TokenRule {
  type: 'TOKEN';
  content: Rule;
}

export interface AliasRule {
  type: 'ALIAS';
  content: Rule;
  named: boolean;
  value: string;
}

export interface FieldRule {
  type: 'FIELD';
  name: string;
  content: Rule;
}

// Grammar configuration interface
export interface GrammarConfig {
  name: string;
  rules: Record<string, Rule>;
  extras?: Rule[];
  conflicts?: string[][];
  precedences?: Rule[][];
  externals?: Rule[];
  inline?: string[];
  supertypes?: string[];
  word?: string;
}

// Helper function types that match tree-sitter's grammar DSL
export type RuleFunction = ($: RuleBuilder) => Rule;

export interface RuleBuilder {
  [key: string]: Rule;
}

// Type-safe grammar builder function
export type GrammarFunction = (config: {
  name: string;
  rules: Record<string, RuleFunction>;
  extras?: (($: RuleBuilder) => Rule)[];
  conflicts?: (($: RuleBuilder) => Rule[])[];
  precedences?: (($: RuleBuilder) => Rule[])[];
  externals?: (($: RuleBuilder) => Rule)[];
  inline?: (($: RuleBuilder) => Rule)[];
  supertypes?: (($: RuleBuilder) => Rule)[];
  word?: ($: RuleBuilder) => Rule;
}) => GrammarConfig;
