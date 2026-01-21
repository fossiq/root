import type {
  Query,
  PipelineExpression,
  TableSource,
  Expression,
} from "@fossiq/kql-ast";
import {
  translateOperator,
  setTranslatePipelineRef,
} from "./translator/operators";

// Store let statement values for variable substitution
const variableMap = new Map<string, Expression>();

export function translate(ast: Query): string {
  // Clear variable map for fresh translation
  variableMap.clear();

  // Process let statements
  for (const letStmt of ast.letStatements) {
    variableMap.set(letStmt.name, letStmt.value);
  }

  // Set up circular dependency for translatePipeline
  setTranslatePipelineRef(translatePipeline);

  // Translate the query expression
  return translateQueryExpression(ast.expression);
}

function translateQueryExpression(expr: Query["expression"]): string {
  if (expr.type === "PipelineExpression") {
    return translatePipeline(expr);
  } else if (expr.type === "UnionExpression") {
    // UnionExpression is a query expression type with tables
    const tables = expr.tables.map((t: TableSource | PipelineExpression) =>
      t.type === "TableReference"
        ? `SELECT * FROM ${t.name}`
        : translatePipeline(t as PipelineExpression)
    );
    return tables.join(" UNION ALL ");
  }
  throw new Error(`Unsupported query expression: ${expr.type}`);
}

function translatePipeline(pipeline: PipelineExpression): string {
  const source = getTableName(pipeline.source);
  const ctes: string[] = [];
  let currentRelation = source;
  let cteIndex = 0;

  for (const operator of pipeline.operators) {
    const nextCteName = `cte_${cteIndex++}`;
    const sql = translateOperator(operator, currentRelation);
    ctes.push(`${nextCteName} AS (${sql})`);
    currentRelation = nextCteName;
  }

  if (ctes.length === 0) {
    return `SELECT * FROM ${source}`;
  }

  return `WITH ${ctes.join(", ")} SELECT * FROM ${currentRelation}`;
}

function getTableName(source: TableSource | PipelineExpression): string {
  if (source.type === "TableReference") {
    return source.name;
  } else if (source.type === "PipelineExpression") {
    return `(${translatePipeline(source)})`;
  }
  throw new Error(`Unsupported table source: ${source.type}`);
}
