export type ASTNode =
  | SourceFile
  | QueryStatement
  | LetStatement
  | PipeExpression
  | Operator
  | WhereClause
  | ProjectClause
  | ExtendClause
  | SummarizeClause
  | AggregationExpression
  | JoinClause
  | UnionClause
  | ParseClause
  | MvExpandClause
  | TakeClause
  | LimitClause
  | SortClause
  | SortExpression
  | DistinctClause
  | CountClause
  | TopClause
  | SearchClause
  | ColumnExpression
  | Expression
  | NamedArgument
  | Identifier
  | QualifiedIdentifier
  | Literal;

export interface SourceFile {
  type: "source_file";
  statements: Statement[];
}

export type Statement = LetStatement | QueryStatement;

export interface LetStatement {
  type: "let_statement";
  name: Identifier;
  value: Expression;
}

export interface QueryStatement {
  type: "query_statement";
  table: Identifier;
  pipes: PipeExpression[];
}

export interface PipeExpression {
  type: "pipe_expression";
  operator: Operator;
}

export type Operator =
  | WhereClause
  | ProjectClause
  | ProjectAwayClause 
  | ProjectKeepClause
  | ProjectRenameClause
  | ProjectReorderClause
  | ExtendClause
  | SummarizeClause
  | JoinClause
  | UnionClause
  | ParseClause
  | MvExpandClause
  | TakeClause
  | LimitClause
  | SortClause
  | DistinctClause
  | CountClause
  | TopClause
  | SearchClause;

export interface ProjectAwayClause {
  type: "project_away_clause";
  columns: ColumnExpression[];
}

export interface ProjectKeepClause {
  type: "project_keep_clause"; 
  columns: ColumnExpression[];
}

export interface ProjectReorderClause {
  type: "project_reorder_clause";
  columns: ColumnExpression[];
}  
  
export interface ProjectRenameClause {
  type: "project_rename_clause";
  columns: ColumnAssignment[]; // Must be assignment form (new = old)

export interface WhereClause {
  type: "where_clause";
  expression: Expression;
}

export interface ProjectClause {
  type: "project_clause";
  columns: ColumnExpression[];
}

export interface ExtendClause {
  type: "extend_clause";
  columns: ColumnExpression[];
}

export interface SummarizeClause {
  type: "summarize_clause";
  aggregations: AggregationExpression[];
  by?: Expression[];
}

export interface AggregationExpression {
  type: "aggregation_expression";
  name?: Identifier;
  aggregation: Expression;
}

export type JoinKind =
  | "inner"
  | "leftouter"
  | "rightouter"
  | "leftanti"
  | "rightanti"
  | "leftsemi"
  | "rightsemi"
  | "fullouter";

export interface JoinClause {
  type: "join_clause";
  kind?: JoinKind;
  rightTable: Identifier;
  conditions: JoinCondition[];
}

export interface JoinCondition {
  type: "join_condition";
  left: Identifier;
  right: Identifier;
}

export type UnionKind = "inner" | "outer";

export interface UnionClause {
  type: "union_clause";
  kind?: UnionKind;
  isfuzzy?: boolean;
  tables: Identifier[];
}

export type ParseKind = "simple" | "regex" | "relaxed";

export interface ParseClause {
  type: "parse_clause";
  kind?: ParseKind;
  source: Expression;
  pattern: StringLiteral;
}

export interface MvExpandClause {
  type: "mv_expand_clause";
  column: Expression;
  to?: Identifier;
  limit?: NumberLiteral;
}

export interface ConditionalExpression {
  type: "conditional_expression";
  function: "iff" | "case";
  arguments: Expression[];
}

export interface NamedArgument {
  type: "named_argument";
  name: Identifier;
  value: Expression;
}

export interface TakeClause {
  type: "take_clause";
  count: NumberLiteral;
}

export interface LimitClause {
  type: "limit_clause";
  count: NumberLiteral;
}

export interface SortClause {
  type: "sort_clause";
  expressions: SortExpression[];
}

export interface SortExpression {
  type: "sort_expression";
  column: Identifier;
  direction?: "asc" | "desc";
}

export interface DistinctClause {
  type: "distinct_clause";
  columns?: ColumnExpression[];
}

export interface CountClause {
  type: "count_clause";
}

export interface TopClause {
  type: "top_clause";
  count: NumberLiteral;
  by?: {
    column: Identifier;
    direction?: "asc" | "desc";
  };
}

export interface SearchClause {
  type: "search_clause";
  columns?: ColumnExpression[];
  term: StringLiteral;
}

export type ColumnExpression = Identifier | ColumnAssignment;

export interface ColumnAssignment {
  type: "column_assignment";
  name: Identifier;
  value: Expression;
}

export type Expression =
  | BinaryExpression
  | ComparisonExpression
  | ArithmeticExpression
  | StringExpression
  | InExpression
  | BetweenExpression
  | ParenthesizedExpression
  | ConditionalExpression
  | TypeCastExpression
  | FunctionCall
  | Identifier
  | QualifiedIdentifier
  | Literal;

export interface BinaryExpression {
  type: "binary_expression";
  operator: "and" | "or";
  left: Expression;
  right: Expression;
}

export interface ComparisonExpression {
  type: "comparison_expression";
  operator: "==" | "!=" | ">" | "<" | ">=" | "<=";
  left: Identifier;
  right: Literal;
}

export interface ArithmeticExpression {
  type: "arithmetic_expression";
  operator: "+" | "-" | "*" | "/" | "%";
  left: Expression;
  right: Expression;
}

export interface ParenthesizedExpression {
  type: "parenthesized_expression";
  expression: Expression;
}

export interface StringExpression {
  type: "string_expression";
  operator: "contains" | "startswith" | "endswith" | "matches" | "has";
  left: Identifier;
  right: StringLiteral;
}

export interface InExpression {
  type: "in_expression";
  left: Identifier;
  values: Literal[];
}

export interface BetweenExpression {
  type: "between_expression";
  left: Identifier;
  min: Expression;
  max: Expression;
}

export interface FunctionCall {
  type: "function_call";
  name: Identifier;
  arguments: (Expression | NamedArgument)[];
}

export interface TypeCastExpression {
  type: "type_cast_expression";
  expression: Expression;
  targetType: string;
}

export interface Identifier {
  type: "identifier";
  name: string;
}

export interface QualifiedIdentifier {
  type: "qualified_identifier";
  table: Identifier;
  column: Identifier;
}

export type Literal =
  | StringLiteral
  | NumberLiteral
  | BooleanLiteral
  | NullLiteral
  | DynamicLiteral
  | DatetimeLiteral
  | TimespanLiteral;

export interface DynamicLiteral {
  type: "dynamic_literal";
  value: string;
}

export interface StringLiteral {
  type: "string_literal";
  value: string;
}

export interface NumberLiteral {
  type: "number_literal";
  value: number;
}

export interface BooleanLiteral {
  type: "boolean_literal";
  value: boolean;
}

export interface NullLiteral {
  type: "null_literal";
  value: null;
}

export interface DatetimeLiteral {
  type: "datetime_literal";
  value: string;
}

export interface TimespanLiteral {
  type: "timespan_literal";
  value: string;
}
