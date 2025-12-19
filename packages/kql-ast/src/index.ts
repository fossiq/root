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
 * CST-to-AST conversion error node
 */
export interface ErrorNode {
    type: "ErrorNode";
    error: string;
    from: number;
    to: number;
}

/**
 * Token types for syntax highlighting
 * Used by syntax highlighters to apply appropriate styling to parsed tokens
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
    | "Query"
    | "PipeStatement"
    | "LetStatement"
    | "TabularStatement";

/**
 * Let statement for variable binding
 */
export interface LetStatement extends ASTNode {
    type: "LetStatement";
    name: string;
    value: Expression;
}

/**
 * Tabular operators (e.g., where, project, summarize)
 */
export type TabularOperator = WhereOperator;

/**
 * Where operator for filtering
 */
export interface WhereOperator extends ASTNode {
    type: "WhereOperator";
    expression: Expression;
}

/**
 * Table reference (source of a pipeline)
 */
export interface TableReference extends ASTNode {
    type: "TableReference";
    name: string;
}

/**
 * Pipeline expression (table source + operators)
 */
export interface PipelineExpression extends ASTNode {
    type: "PipelineExpression";
    source: TableReference | PipelineExpression;
    operators: TabularOperator[];
}

/**
 * Top-level query node
 */
export interface Query extends ASTNode {
    type: "Query";
    letStatements: LetStatement[];
    pipeline: PipelineExpression;
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
    | "ParenthesizedExpression"
    | "NumberLiteral"
    | "StringLiteral";

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
 * Generic literal value
 */
export interface Literal extends ASTNode {
    type: "Literal";
    value: string | number | boolean | null;
    raw: string;
}

/**
 * Number literal
 */
export interface NumberLiteral extends ASTNode {
    type: "NumberLiteral";
    value: number;
    raw: string;
}

/**
 * String literal
 */
export interface StringLiteral extends ASTNode {
    type: "StringLiteral";
    value: string;
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
    | ParenthesizedExpression
    | NumberLiteral
    | StringLiteral;

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
    ast?: Query;
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
