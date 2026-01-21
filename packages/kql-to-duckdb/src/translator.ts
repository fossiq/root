import type {
  Query,
  PipelineExpression,
  TableSource,
  Expression,
  BinaryExpression,
  FunctionCall,
  Identifier,
  NumberLiteral,
  StringLiteral,
  Literal,
  ParenthesizedExpression,
  UnaryExpression,
  ProjectOperator,
  ProjectColumn,
  ProjectAwayOperator,
  ProjectKeepOperator,
  ProjectRenameOperator,
  ProjectReorderOperator,
  WhereOperator,
  ExtendOperator,
  SortOperator,
  SortExpression,
  LimitOperator,
  TakeOperator,
  TopOperator,
  DistinctOperator,
  SummarizeOperator,
  Aggregation,
  JoinOperator,
  UnionOperator,
  MvExpandOperator,
  TabularOperator,
} from "@fossiq/kql-ast";

// Store let statement values for variable substitution
const variableMap = new Map<string, Expression>();

export function translate(ast: Query): string {
  // Clear variable map for fresh translation
  variableMap.clear();

  // Process let statements
  for (const letStmt of ast.letStatements) {
    variableMap.set(letStmt.name, letStmt.value);
  }

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

function translateOperator(
  operator: TabularOperator,
  inputRelation: string
): string {
  switch (operator.type) {
    case "WhereOperator":
      return translateWhere(operator as WhereOperator, inputRelation);
    case "ProjectOperator":
      return translateProject(operator as ProjectOperator, inputRelation);
    case "ProjectAwayOperator":
      return translateProjectAway(
        operator as ProjectAwayOperator,
        inputRelation
      );
    case "ProjectKeepOperator":
      return translateProjectKeep(
        operator as ProjectKeepOperator,
        inputRelation
      );
    case "ProjectRenameOperator":
      return translateProjectRename(
        operator as ProjectRenameOperator,
        inputRelation
      );
    case "ProjectReorderOperator":
      return translateProjectReorder(
        operator as ProjectReorderOperator,
        inputRelation
      );
    case "ExtendOperator":
      return translateExtend(operator as ExtendOperator, inputRelation);
    case "SortOperator":
      return translateSort(operator as SortOperator, inputRelation);
    case "LimitOperator":
      return translateLimit(operator as LimitOperator, inputRelation);
    case "TakeOperator":
      return translateTake(operator as TakeOperator, inputRelation);
    case "TopOperator":
      return translateTop(operator as TopOperator, inputRelation);
    case "DistinctOperator":
      return translateDistinct(operator as DistinctOperator, inputRelation);
    case "SummarizeOperator":
      return translateSummarize(operator as SummarizeOperator, inputRelation);
    case "JoinOperator":
      return translateJoin(operator as JoinOperator, inputRelation);
    case "UnionOperator":
      return translateUnion(operator as UnionOperator, inputRelation);
    case "MvExpandOperator":
      return translateMvExpand(operator as MvExpandOperator, inputRelation);
    default:
      throw new Error(
        `Unsupported operator: ${
          (operator as TabularOperator & { type: string }).type
        }`
      );
  }
}

function translateWhere(
  operator: WhereOperator,
  inputRelation: string
): string {
  const condition = translateExpression(operator.expression);
  return `SELECT * FROM ${inputRelation} WHERE ${condition}`;
}

function translateProject(
  operator: ProjectOperator,
  inputRelation: string
): string {
  const columns = operator.columns.map(translateProjectColumn).join(", ");
  return `SELECT ${columns} FROM ${inputRelation}`;
}

function translateProjectColumn(col: ProjectColumn): string {
  const expr = translateExpression(col.expression);
  if (col.alias) {
    return `${expr} AS ${col.alias}`;
  }
  return expr;
}

function translateProjectAway(
  operator: ProjectAwayOperator,
  inputRelation: string
): string {
  const columnsToRemove = operator.columns.join(", ");
  return `SELECT * EXCLUDE (${columnsToRemove}) FROM ${inputRelation}`;
}

function translateProjectKeep(
  operator: ProjectKeepOperator,
  inputRelation: string
): string {
  const columns = operator.columns.join(", ");
  return `SELECT ${columns} FROM ${inputRelation}`;
}

function translateProjectRename(
  operator: ProjectRenameOperator,
  inputRelation: string
): string {
  const renames = operator.renames
    .map(
      (r: { newName: string; oldName: string }) =>
        `${r.oldName} AS ${r.newName}`
    )
    .join(", ");
  return `SELECT * REPLACE (${renames}) FROM ${inputRelation}`;
}

function translateProjectReorder(
  operator: ProjectReorderOperator,
  inputRelation: string
): string {
  const columns = operator.columns.join(", ");
  return `SELECT ${columns}, * EXCLUDE (${columns}) FROM ${inputRelation}`;
}

function translateExtend(
  operator: ExtendOperator,
  inputRelation: string
): string {
  const columns = operator.columns.map(translateProjectColumn).join(", ");
  return `SELECT *, ${columns} FROM ${inputRelation}`;
}

function translateSort(operator: SortOperator, inputRelation: string): string {
  const orderBy = operator.expressions.map(translateSortExpression).join(", ");
  return `SELECT * FROM ${inputRelation} ORDER BY ${orderBy}`;
}

function translateSortExpression(expr: SortExpression): string {
  const column = translateExpression(expr.expression);
  const direction = expr.direction ? expr.direction.toUpperCase() : "ASC";
  const nullsClause = expr.nulls ? ` NULLS ${expr.nulls.toUpperCase()}` : "";
  return `${column} ${direction}${nullsClause}`;
}

function translateLimit(
  operator: LimitOperator,
  inputRelation: string
): string {
  const count = translateExpression(operator.count);
  return `SELECT * FROM ${inputRelation} LIMIT ${count}`;
}

function translateTake(operator: TakeOperator, inputRelation: string): string {
  const count = translateExpression(operator.count);
  return `SELECT * FROM ${inputRelation} LIMIT ${count}`;
}

function translateTop(operator: TopOperator, inputRelation: string): string {
  const count = translateExpression(operator.count);
  const orderBy = operator.by.map(translateSortExpression).join(", ");
  return `SELECT * FROM ${inputRelation} ORDER BY ${orderBy} LIMIT ${count}`;
}

function translateDistinct(
  operator: DistinctOperator,
  inputRelation: string
): string {
  if (operator.columns.length === 0) {
    return `SELECT DISTINCT * FROM ${inputRelation}`;
  }
  const columns = operator.columns.join(", ");
  return `SELECT DISTINCT ${columns} FROM ${inputRelation}`;
}

function translateSummarize(
  operator: SummarizeOperator,
  inputRelation: string
): string {
  const aggs = operator.aggregations.map(translateAggregation);
  const groups = operator.by.map(translateExpression);
  const selectList = [...groups, ...aggs].join(", ");
  const groupBy = groups.length > 0 ? ` GROUP BY ${groups.join(", ")}` : "";
  return `SELECT ${selectList} FROM ${inputRelation}${groupBy}`;
}

function translateAggregation(agg: Aggregation): string {
  const expr =
    agg.function.type === "FunctionCall"
      ? translateFunctionCall(agg.function)
      : "NULL";
  if (agg.alias) {
    return `${expr} AS ${agg.alias}`;
  }
  return expr;
}

function translateJoin(operator: JoinOperator, inputRelation: string): string {
  const rightTable =
    operator.rightTable.type === "TableReference"
      ? operator.rightTable.name
      : "(subquery)";
  const kind = operator.kind || "inner";
  const joinType = kind.toUpperCase().replace("UNIQUE", " UNIQUE");
  const conditions = operator.on.map(translateExpression).join(" AND ");
  return `SELECT * FROM ${inputRelation} ${joinType} JOIN ${rightTable} ON ${conditions}`;
}

function translateUnion(
  operator: UnionOperator,
  inputRelation: string
): string {
  const tables = [
    inputRelation,
    ...operator.tables.map((t: TableSource | PipelineExpression) =>
      t.type === "TableReference"
        ? t.name
        : `(${translatePipeline(t as PipelineExpression)})`
    ),
  ];
  return tables.join(" UNION ALL ");
}

function translateMvExpand(
  operator: MvExpandOperator,
  inputRelation: string
): string {
  const column = operator.columns[0];
  return `SELECT * REPLACE (UNNEST(${column}) AS ${column}) FROM ${inputRelation}`;
}

function translateExpression(expr: Expression): string {
  switch (expr.type) {
    case "BinaryExpression":
      return translateBinaryExpression(expr as BinaryExpression);
    case "FunctionCall":
      return translateFunctionCall(expr as FunctionCall);
    case "Identifier":
      return (expr as Identifier).name;
    case "NumberLiteral":
      return String((expr as NumberLiteral).value);
    case "StringLiteral":
      return `'${(expr as StringLiteral).value}'`;
    case "Literal":
      return translateLiteral(expr as Literal);
    case "ParenthesizedExpression":
      return `(${translateExpression(
        (expr as ParenthesizedExpression).expression
      )})`;
    case "UnaryExpression": {
      const unaryExpr = expr as UnaryExpression;
      return `${unaryExpr.operator} ${translateExpression(unaryExpr.operand)}`;
    }
    default:
      throw new Error(
        `Unsupported expression type: ${
          (expr as Expression & { type: string }).type
        }`
      );
  }
}

function translateLiteral(expr: Literal): string {
  if (expr.value === null) return "NULL";
  if (typeof expr.value === "boolean") return expr.value ? "TRUE" : "FALSE";
  if (typeof expr.value === "string") return `'${expr.value}'`;
  return String(expr.value);
}

function translateBinaryExpression(expr: BinaryExpression): string {
  const left = translateExpression(expr.left);
  const operator = expr.operator;

  // Handle string operators that need pattern modification
  if (operator === "contains") {
    const right =
      expr.right.type === "StringLiteral"
        ? `'%${(expr.right as StringLiteral).value}%'`
        : `'%' || ${translateExpression(expr.right)} || '%'`;
    return `${left} LIKE ${right}`;
  } else if (operator === "startswith") {
    const right =
      expr.right.type === "StringLiteral"
        ? `'${(expr.right as StringLiteral).value}%'`
        : `${translateExpression(expr.right)} || '%'`;
    return `${left} LIKE ${right}`;
  } else if (operator === "endswith") {
    const right =
      expr.right.type === "StringLiteral"
        ? `'%${(expr.right as StringLiteral).value}'`
        : `'%' || ${translateExpression(expr.right)}`;
    return `${left} LIKE ${right}`;
  } else if (operator === "has") {
    // 'has' in KQL means word boundary match - approximate with REGEXP
    const right =
      expr.right.type === "StringLiteral"
        ? `'\\b${(expr.right as StringLiteral).value}\\b'`
        : translateExpression(expr.right);
    return `${left} REGEXP ${right}`;
  }

  // Default handling for other operators
  const right = translateExpression(expr.right);
  const sqlOperator = translateOperatorToken(operator);
  return `${left} ${sqlOperator} ${right}`;
}

function translateOperatorToken(op: string): string {
  const opMap: Record<string, string> = {
    "==": "=",
    and: "AND",
    or: "OR",
    not: "NOT",
    in: "IN",
    between: "BETWEEN",
  };
  return opMap[op] || op;
}

function translateFunctionCall(func: FunctionCall): string {
  const name = func.name.toUpperCase();
  const args = func.args.map(translateExpression).join(", ");

  // Handle special functions
  if (name === "AGO") {
    return `NOW() - INTERVAL ${args}`;
  } else if (name === "NOW") {
    return "NOW()";
  } else if (name === "COUNT") {
    return args ? `COUNT(${args})` : "COUNT(*)";
  }

  return `${name}(${args})`;
}
