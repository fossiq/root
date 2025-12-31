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
  | "SetStatement"
  | "DeclareQueryParametersStatement"
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
 * Set statement for query options
 */
export interface SetStatement extends ASTNode {
  type: "SetStatement";
  name: string;
  value: Literal | Identifier;
}

/**
 * Declare query parameters statement
 */
export interface DeclareQueryParametersStatement extends ASTNode {
  type: "DeclareQueryParametersStatement";
  parameters: QueryParameter[];
}

export interface QueryParameter extends ASTNode {
  type: "QueryParameter";
  name: string;
  paramType: string;
  defaultValue?: Expression;
}

/**
 * Tabular operators (e.g., where, project, summarize)
 */
export type TabularOperator =
  | WhereOperator
  | ProjectOperator
  | ProjectAwayOperator
  | ProjectKeepOperator
  | ProjectRenameOperator
  | ProjectReorderOperator
  | ExtendOperator
  | SortOperator
  | LimitOperator
  | TakeOperator
  | TopOperator
  | DistinctOperator
  | SummarizeOperator
  | MvExpandOperator
  | UnionOperator
  | JoinOperator
  | ParseOperator
  | EvaluateOperator
  | MakeSeriesOperator
  | PartitionOperator
  | SampleOperator
  | GetSchemaOperator
  | RenderOperator
  | SerializeOperator
  | DatatableOperator
  | PrintOperator;

/**
 * Where operator for filtering
 */
export interface WhereOperator extends ASTNode {
  type: "WhereOperator";
  expression: Expression;
}

/**
 * Project operator
 */
export interface ProjectOperator extends ASTNode {
  type: "ProjectOperator";
  columns: ProjectColumn[];
}

export interface ProjectColumn extends ASTNode {
  type: "ProjectColumn";
  expression: Expression;
  alias?: string;
}

export interface ProjectAwayOperator extends ASTNode {
  type: "ProjectAwayOperator";
  columns: string[];
}

export interface ProjectKeepOperator extends ASTNode {
  type: "ProjectKeepOperator";
  columns: string[];
}

export interface ProjectRenameOperator extends ASTNode {
  type: "ProjectRenameOperator";
  renames: { newName: string; oldName: string }[];
}

export interface ProjectReorderOperator extends ASTNode {
  type: "ProjectReorderOperator";
  columns: string[];
}

/**
 * Extend operator
 */
export interface ExtendOperator extends ASTNode {
  type: "ExtendOperator";
  columns: ProjectColumn[];
}

/**
 * Sort operator
 */
export interface SortOperator extends ASTNode {
  type: "SortOperator";
  expressions: SortExpression[];
}

export interface SortExpression extends ASTNode {
  type: "SortExpression";
  expression: Expression;
  direction?: string; // "asc" | "desc"
  nulls?: string; // "first" | "last"
}

/**
 * Limit/Take operators
 */
export interface LimitOperator extends ASTNode {
  type: "LimitOperator";
  count: Expression; // Can be a literal number or calculation
}

export interface TakeOperator extends ASTNode {
  type: "TakeOperator";
  count: Expression;
}

/**
 * Top operator
 */
export interface TopOperator extends ASTNode {
  type: "TopOperator";
  count: Expression;
  by: SortExpression[];
}

/**
 * Distinct operator
 */
export interface DistinctOperator extends ASTNode {
  type: "DistinctOperator";
  columns: string[];
}

/**
 * Summarize operator
 */
export interface SummarizeOperator extends ASTNode {
  type: "SummarizeOperator";
  aggregations: Aggregation[];
  by: Expression[];
}

export interface Aggregation extends ASTNode {
  type: "Aggregation";
  alias?: string;
  function: FunctionCall | ErrorNode;
}

/**
 * MvExpand operator
 */
export interface MvExpandOperator extends ASTNode {
  type: "MvExpandOperator";
  columns: string[];
  // TODO: Support complex mv-expand with bag expansion, limit, etc.
}

/**
 * Union operator (tabular)
 */
export interface UnionOperator extends ASTNode {
  type: "UnionOperator";
  tables: (TableSource | PipelineExpression)[];
  kind?: string;
  withSource?: string;
  // TODO: Add parameters (kind, withsource, etc.)
}

/**
 * Join operator
 */
export interface JoinOperator extends ASTNode {
  type: "JoinOperator";
  kind?: string; // inner, outer, leftouter, etc.
  rightTable: TableSource | PipelineExpression;
  on: Expression[];
}

/**
 * Parse operator
 */
export interface ParseOperator extends ASTNode {
  type: "ParseOperator";
  column: string; // The source column
  kind?: "simple" | "regex" | "relaxed";
  pattern: string; // The pattern string
}

/**
 * Evaluate operator (plugins)
 */
export interface EvaluateOperator extends ASTNode {
  type: "EvaluateOperator";
  plugin: FunctionCall; // treat plugin invocation as a function call
}

/**
 * MakeSeries operator
 */
export interface MakeSeriesOperator extends ASTNode {
  type: "MakeSeriesOperator";
  aggregations: Aggregation[];
  on: SortExpression; // The time column
  step: Expression; // The time step
  by?: Expression[]; // Group by columns
}

/**
 * Partition operator
 */
export interface PartitionOperator extends ASTNode {
  type: "PartitionOperator";
  by: string; // Partition column
  pipeline: PipelineExpression; // Sub-query
}

/**
 * Sample operator
 */
export interface SampleOperator extends ASTNode {
  type: "SampleOperator";
  count: Expression;
  kind?: string; // distinct?
}

/**
 * GetSchema operator
 */
export interface GetSchemaOperator extends ASTNode {
  type: "GetSchemaOperator";
}

/**
 * Render operator
 */
export interface RenderOperator extends ASTNode {
  type: "RenderOperator";
  chartType: string;
  options?: Record<string, string>; // Simplification
}

/**
 * Serialize operator
 */
export interface SerializeOperator extends ASTNode {
  type: "SerializeOperator";
  columns?: string[]; // Optional specific columns to serialize
}

/**
 * Datatable operator
 */
export interface DatatableOperator extends ASTNode {
  type: "DatatableOperator";
  schema: { name: string; type: string }[];
  data: Literal[][];
}

/**
 * Print operator
 */
export interface PrintOperator extends ASTNode {
  type: "PrintOperator";
  expressions: ProjectColumn[];
}

/**
 * Range operator
 */
export interface RangeOperator extends ASTNode {
  type: "RangeOperator";
  name: string;
  from: Expression;
  to: Expression;
  step: Expression;
}

/**
 * Table reference (source of a pipeline)
 */
export interface TableReference extends ASTNode {
  type: "TableReference";
  name: string;
}

/**
 * Table source (table reference or operator producing a table)
 */
export type TableSource = TableReference | RangeOperator;

/**
 * Pipeline expression (table source + operators)
 */
export interface PipelineExpression extends ASTNode {
  type: "PipelineExpression";
  source: TableSource | PipelineExpression;
  operators: TabularOperator[];
}

/**
 * Top-level query node
 */
export interface Query extends ASTNode {
  type: "Query";
  letStatements: LetStatement[];
  setStatements?: SetStatement[];
  declareParameters?: DeclareQueryParametersStatement[];
  // Can be a simple pipeline or other query expressions (union, search, find)
  expression: QueryExpression;
  // Legacy support (optional)
  pipeline?: PipelineExpression;
}

export type QueryExpression =
  | PipelineExpression
  | UnionExpression
  | SearchExpression
  | FindExpression;

export interface UnionExpression extends ASTNode {
  type: "UnionExpression";
  tables: (TableSource | PipelineExpression)[];
}

export interface SearchExpression extends ASTNode {
  type: "SearchExpression";
  // Placeholder
}

export interface FindExpression extends ASTNode {
  type: "FindExpression";
  // Placeholder
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
  | StringLiteral
  | ErrorNode;

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
