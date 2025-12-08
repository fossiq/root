export type ASTNode =
  | SourceFile
  | QueryStatement
  | PipeExpression
  | Operator
  | WhereClause
  | ProjectClause
  | ExtendClause
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
  | Identifier
  | Literal;

export interface SourceFile {
  type: 'source_file';
  statements: QueryStatement[];
}

export interface QueryStatement {
  type: 'query_statement';
  table: Identifier;
  pipes: PipeExpression[];
}

export interface PipeExpression {
  type: 'pipe_expression';
  operator: Operator;
}

export type Operator = WhereClause | ProjectClause | ExtendClause | TakeClause | LimitClause | SortClause | DistinctClause | CountClause | TopClause | SearchClause;

export interface WhereClause {
  type: 'where_clause';
  expression: Expression;
}

export interface ProjectClause {
  type: 'project_clause';
  columns: ColumnExpression[];
}

export interface ExtendClause {
  type: 'extend_clause';
  columns: ColumnExpression[];
}

export interface TakeClause {
  type: 'take_clause';
  count: NumberLiteral;
}

export interface LimitClause {
  type: 'limit_clause';
  count: NumberLiteral;
}

export interface SortClause {
  type: 'sort_clause';
  expressions: SortExpression[];
}

export interface SortExpression {
  type: 'sort_expression';
  column: Identifier;
  direction?: 'asc' | 'desc';
}

export interface DistinctClause {
  type: 'distinct_clause';
  columns?: ColumnExpression[];
}

export interface CountClause {
  type: 'count_clause';
}

export interface TopClause {
  type: 'top_clause';
  count: NumberLiteral;
  by?: {
    column: Identifier;
    direction?: 'asc' | 'desc';
  };
}

export interface SearchClause {
  type: 'search_clause';
  columns?: ColumnExpression[];
  term: StringLiteral;
}

export type ColumnExpression = Identifier | ColumnAssignment;

export interface ColumnAssignment {
  type: 'column_assignment';
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
  | Identifier
  | Literal;

export interface BinaryExpression {
  type: 'binary_expression';
  operator: 'and' | 'or';
  left: Expression;
  right: Expression;
}

export interface ComparisonExpression {
  type: 'comparison_expression';
  operator: '==' | '!=' | '>' | '<' | '>=' | '<=';
  left: Identifier;
  right: Literal;
}

export interface ArithmeticExpression {
  type: 'arithmetic_expression';
  operator: '+' | '-' | '*' | '/' | '%';
  left: Expression;
  right: Expression;
}

export interface ParenthesizedExpression {
  type: 'parenthesized_expression';
  expression: Expression;
}

export interface StringExpression {
  type: 'string_expression';
  operator: 'contains' | 'startswith' | 'endswith' | 'matches' | 'has';
  left: Identifier;
  right: StringLiteral;
}

export interface InExpression {
  type: 'in_expression';
  left: Identifier;
  values: Literal[];
}

export interface BetweenExpression {
  type: 'between_expression';
  left: Identifier;
  min: Literal;
  max: Literal;
}

export interface Identifier {
  type: 'identifier';
  name: string;
}

export type Literal = StringLiteral | NumberLiteral | BooleanLiteral | NullLiteral;

export interface StringLiteral {
  type: 'string_literal';
  value: string;
}

export interface NumberLiteral {
  type: 'number_literal';
  value: number;
}

export interface BooleanLiteral {
  type: 'boolean_literal';
  value: boolean;
}

export interface NullLiteral {
  type: 'null_literal';
  value: null;
}
