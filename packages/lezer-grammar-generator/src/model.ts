/** Expression tree used for Lezer rule/token patterns. */
export type PatternExpression =
  | { type: "literal"; value: string }
  | {
      type: "regex";
      pattern: string | RegExp | readonly (string | RegExp)[];
    }
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
  readonly dialect?: string;
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
  readonly dialect?: string;
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
  readonly detectDelim?: boolean;
  readonly dialects?: readonly string[];
  readonly tokens?: readonly TokenDef[];
  readonly localTokens?: readonly TokenDef[];
  readonly tokenPrecedence?: readonly string[];
  readonly macros?: Readonly<Record<string, MacroDef>>;
  readonly rules: Readonly<Record<string, RuleDef>>;
  readonly precedence?: readonly PrecedenceLevel[];
  readonly externals?: readonly string[];
}

/** Union type for validation error codes. */
export type ValidationErrorCode =
  // Config validation errors
  | "config.grammarName.missing"
  | "config.grammarName.invalid"
  | "config.astTypes.missing"
  | "config.astTypes.empty"
  | "config.astTypes.grammarName.missing"
  | "config.astTypes.grammarFields.missing"
  | "config.astTypes.grammarFields.empty"
  | "config.astTypes.duplicate"
  | "config.astTypes.noRules"
  | "config.tokens.name.missing"
  | "config.tokens.specialized.invalid"
  | "config.tokens.pattern.missing"
  | "config.tokens.pattern.empty"
  | "config.tokens.duplicate"
  | "config.tokens.specialized.unknownBase"
  | "config.precedence.unknownToken"
  | "config.tokenPrecedence.unknownToken"
  | "config.astTypes.unknownReference"
  | "config.passthrough.unbalanced"
  | "config.passthrough.tokenUnbalanced"
  | "config.passthrough.emptyAlternative"
  | "config.macros.undefined"
  | "config.tokenPattern.tokenUnbalanced"
  | "config.tokenPattern.emptyAlternative"
  // Plugin validation errors
  | "plugins.skipWhitespace.conflict"
  | "plugins.tokens.duplicate"
  | "plugins.rules.duplicate"
  | "plugins.macros.duplicate"
  | "plugins.name.missing"
  | "plugins.name.duplicate"
  | "plugins.dependency.cyclic"
  | "plugins.dependency.missing"
  // Grammar validation errors
  | "rules.empty"
  | "top.unknown"
  | "top.missingName"
  | "name.invalid"
  // Token validation errors
  | "token.invalidName"
  | "token.duplicate"
  | "token.reservedName"
  // Rule validation errors
  | "rule.invalidName"
  | "rule.reservedName"
  // External validation errors
  | "external.duplicate"
  | "external.invalidName"
  // Name conflict validation errors
  | "name.duplicate"
  // Dialect validation errors
  | "dialect.unknown"
  // Reference validation errors
  | "ref.unknown"
  | "ref.unexpectedArgs"
  | "ref.arity"
  | "skip.unknown"
  | "rules.cycle"
  | "rules.unused";

/** Severity level for validation issues. */
export type IssueLevel = "error" | "warning";

/** Validation issue with optional path context. */
export interface ValidationIssue {
  readonly code: ValidationErrorCode;
  readonly message: string;
  readonly path?: string;
  readonly level: IssueLevel;
}

/** Validation result for a grammar definition. */
export interface ValidationResult {
  readonly ok: boolean;
  readonly issues: readonly ValidationIssue[];
}
