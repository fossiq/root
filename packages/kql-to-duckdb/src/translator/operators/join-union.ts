import type {
  JoinOperator,
  UnionOperator,
  MvExpandOperator,
  PipelineExpression,
  TableSource,
} from "@fossiq/kql-ast";
import { translateExpression } from "../expressions";

// Reference to translatePipeline for recursive calls
let translatePipelineRef: (pipeline: PipelineExpression) => string;

export function setTranslatePipelineRef(
  fn: (pipeline: PipelineExpression) => string
) {
  translatePipelineRef = fn;
}

export function translateJoin(
  operator: JoinOperator,
  inputRelation: string
): string {
  const rightTable =
    operator.rightTable.type === "TableReference"
      ? operator.rightTable.name
      : "(subquery)";
  const kind = operator.kind || "inner";
  const joinType = kind.toUpperCase().replace("UNIQUE", " UNIQUE");
  const conditions = operator.on.map(translateExpression).join(" AND ");
  return `SELECT * FROM ${inputRelation} ${joinType} JOIN ${rightTable} ON ${conditions}`;
}

export function translateUnion(
  operator: UnionOperator,
  inputRelation: string
): string {
  const tables = [
    inputRelation,
    ...operator.tables.map((t: TableSource | PipelineExpression) =>
      t.type === "TableReference"
        ? t.name
        : `(${translatePipelineRef(t as PipelineExpression)})`
    ),
  ];
  return tables.join(" UNION ALL ");
}

export function translateMvExpand(
  operator: MvExpandOperator,
  inputRelation: string
): string {
  const column = operator.columns[0];
  return `SELECT * REPLACE (UNNEST(${column}) AS ${column}) FROM ${inputRelation}`;
}
