/** Expression tree used for Lezer rule/token patterns. */
export type PatternExpression =
  | { type: "literal"; value: string }
  | { type: "regex"; pattern: string | RegExp }
  | { type: "ref"; name: string; args?: readonly string[] }
  | { type: "seq"; elements: readonly PatternExpression[] }
  | { type: "choice"; alternatives: readonly PatternExpression[] }
  | { type: "repeat"; kind: "*" | "+"; expr: PatternExpression }
  | { type: "optional"; expr: PatternExpression }
  | { type: "group"; expr: PatternExpression }
  | { type: "raw"; content: string };

/** Rule definition with optional params and rule props. */
export interface RuleDef {
  readonly expression: PatternExpression;
  readonly params?: readonly string[];
  readonly props?: Readonly<Record<string, string | number | boolean>>;
  readonly skip?: PatternExpression;
}

/** Macro definition with optional params. */
export interface MacroDef {
  readonly expression: PatternExpression;
  readonly params?: readonly string[];
}

/** Token definition with a pattern expression. */
export interface TokenDef {
  readonly name: string;
  readonly pattern: PatternExpression;
}

/** Precedence line entry for the @precedence block. */
export interface PrecedenceLevel {
  readonly name: string;
  readonly associativity?: "left" | "right" | "none";
}

/** Grammar definition used by the Lezer serializer. */
export interface GrammarDefinition {
  readonly name?: string;
  readonly top?: string;
  readonly skip?: PatternExpression;
  readonly tokens?: readonly TokenDef[];
  readonly macros?: Readonly<Record<string, MacroDef>>;
  readonly rules: Readonly<Record<string, RuleDef>>;
  readonly precedence?: readonly PrecedenceLevel[];
  readonly externals?: readonly string[];
}

/** Severity level for validation issues. */
export type IssueLevel = "error" | "warning";

/** Validation issue with optional path context. */
export interface ValidationIssue {
  readonly code: string;
  readonly message: string;
  readonly path?: string;
  readonly level: IssueLevel;
}

/** Validation result for a grammar definition. */
export interface ValidationResult {
  readonly ok: boolean;
  readonly issues: readonly ValidationIssue[];
}
