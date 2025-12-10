/**
 * @fossiq/kql-ast
 *
 * Shared KQL AST type definitions for multiple parser implementations.
 * Provides a language-agnostic interface for KQL syntax trees.
 */

/**
 * Base node type for all AST nodes
 */
export interface ASTNode {
  type: string;
  start: number;
  end: number;
}

/**
 * Token types for syntax highlighting
 */
export type TokenType =
  // Keywords
  | "keyword"
  // Literals
  | "string"
  | "number"
  | "boolean"
  // Identifiers and names
  | "identifier"
  | "functionName"
  | "columnName"
  | "tableName"
  // Operators
  | "operator"
  | "comparisonOperator"
  | "logicalOperator"
  // Delimiters
  | "punctuation"
  // Comments
  | "comment"
  // Whitespace
  | "whitespace"
  // Special
  | "invalid";

/**
 * Statement types
 */
export type StatementType =
  | "QueryStatement"
  | "PipeStatement"
  | "LetStatement"
  | "TabularStatement";

/**
 * Query statement node
 */
export interface QueryStatement extends ASTNode {
  type: "QueryStatement";
  tabularStatement: TabularStatement;
}

/**
 * Tabular statement node (table reference or transformation)
 */
export interface TabularStatement extends ASTNode {
  type: "TabularStatement";
  source: TableSource;
  operators: QueryOperator[];
}

/**
 * Table source (table name or subquery)
 */
export interface TableSource extends ASTNode {
  type: "TableSource";
  name: string;
}

/**
 * Query operator (where, select, filter, etc.)
 */
export interface QueryOperator extends ASTNode {
  type: string;
  operator: string;
  expression?: Expression;
}

/**
 * Expression types
 */
export type ExpressionType =
  | "BinaryExpression"
  | "UnaryExpression"
  | "FunctionCall"
  | "Identifier"
  | "Literal"
  | "ParenthesizedExpression";

/**
 * Binary expression (e.g., a > 5)
 */
export interface BinaryExpression extends ASTNode {
  type: "BinaryExpression";
  left: Expression;
  operator: string;
  right: Expression;
}

/**
 * Function call (e.g., now(), contains("text"))
 */
export interface FunctionCall extends ASTNode {
  type: "FunctionCall";
  name: string;
  args: Expression[];
}

/**
 * Identifier reference
 */
export interface Identifier extends ASTNode {
  type: "Identifier";
  name: string;
}

/**
 * Literal value
 */
export interface Literal extends ASTNode {
  type: "Literal";
  value: string | number | boolean | null;
  raw: string;
}

/**
 * Union of all expression types
 */
export type Expression =
  | BinaryExpression
  | UnaryExpression
  | FunctionCall
  | Identifier
  | Literal
  | ParenthesizedExpression;

/**
 * Unary expression (e.g., !condition)
 */
export interface UnaryExpression extends ASTNode {
  type: "UnaryExpression";
  operator: string;
  operand: Expression;
}

/**
 * Parenthesized expression
 */
export interface ParenthesizedExpression extends ASTNode {
  type: "ParenthesizedExpression";
  expression: Expression;
}

/**
 * Parsed KQL document
 */
export interface KQLDocument extends ASTNode {
  type: "KQLDocument";
  statement: QueryStatement;
}

/**
 * Parser configuration options
 */
export interface ParserOptions {
  /** Include whitespace and comment nodes */
  includeTrivia?: boolean;
  /** Position tracking (character offsets) */
  trackPositions?: boolean;
}

/**
 * Highlight token - used for syntax highlighting
 */
export interface HighlightToken {
  type: TokenType;
  start: number;
  end: number;
  value: string;
}

/**
 * Parser result
 */
export interface ParseResult {
  ast?: KQLDocument;
  tokens?: HighlightToken[];
  errors: ParseError[];
}

/**
 * Parse error
 */
export interface ParseError extends ASTNode {
  type: "ParseError";
  message: string;
  expected?: string[];
}
