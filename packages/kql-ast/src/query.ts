import type { ASTNode } from "./base";
import type { Expression } from "./expressions";
import type {
  DeclareQueryParametersStatement,
  LetStatement,
  SetStatement,
} from "./statements";
import type { TabularOperator } from "./operators/tabular";

export interface RangeOperator extends ASTNode {
  type: "RangeOperator";
  name: string;
  from: Expression;
  to: Expression;
  step: Expression;
}

export interface TableReference extends ASTNode {
  type: "TableReference";
  name: string;
}

export type TableSource = TableReference | RangeOperator;

export interface PipelineExpression extends ASTNode {
  type: "PipelineExpression";
  source: TableSource | PipelineExpression;
  operators: TabularOperator[];
}

export interface Query extends ASTNode {
  type: "Query";
  letStatements: LetStatement[];
  setStatements?: SetStatement[];
  declareParameters?: DeclareQueryParametersStatement[];
  expression: QueryExpression;
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
}

export interface FindExpression extends ASTNode {
  type: "FindExpression";
}
