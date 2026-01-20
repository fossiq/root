/**
 * Base node type for all AST nodes.
 */
export interface ASTNode {
  type: string;
  start: number;
  end: number;
}

/**
 * CST-to-AST conversion error node.
 */
export interface ErrorNode {
  type: "ErrorNode";
  error: string;
  from: number;
  to: number;
}

/**
 * Token types for syntax highlighting.
 */
export type TokenType =
  | "keyword"
  | "string"
  | "number"
  | "boolean"
  | "identifier"
  | "functionName"
  | "columnName"
  | "tableName"
  | "operator"
  | "comparisonOperator"
  | "logicalOperator"
  | "punctuation"
  | "comment"
  | "whitespace"
  | "invalid";

/**
 * Statement types.
 */
export type StatementType =
  | "Query"
  | "PipeStatement"
  | "LetStatement"
  | "SetStatement"
  | "DeclareQueryParametersStatement"
  | "TabularStatement";
