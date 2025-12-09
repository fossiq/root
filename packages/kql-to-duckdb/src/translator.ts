import type {
  SourceFile,
  QueryStatement,
  Operator,
  Expression,
  BinaryExpression,
  ComparisonExpression,
  ArithmeticExpression,
  StringExpression,
  WhereClause,
  ProjectClause,
  TakeClause,
  LimitClause,
  ColumnExpression,
  SummarizeClause,
  FunctionCall,
  ExtendClause,
  SortClause,
  SortExpression,
  DistinctClause,
  JoinClause,
  TopClause,
  UnionClause,
} from "@fossiq/kql-parser";

export function translate(ast: SourceFile): string {
  if (ast.statements.length === 0) {
    return "";
  }

  // For now, just handle the first statement
  const statement = ast.statements[0];
  if (statement.type !== "query_statement") {
    throw new Error(`Unsupported statement type: ${statement.type}`);
  }

  return translateQuery(statement);
}

function translateQuery(query: QueryStatement): string {
  const tableName = query.table.name;
  const ctes: string[] = [];
  let currentRelation = tableName;
  let cteIndex = 0;

  for (const pipe of query.pipes) {
    // Check if this is a union operator
    if (pipe.operator.type === "union_clause") {
      const unionOp = translateUnion(pipe.operator as UnionClause, tableName);
      return unionOp;
    }

    const nextCteName = `cte_${cteIndex++}`;
    const sql = translatePipe(pipe.operator, currentRelation);
    ctes.push(`${nextCteName} AS (${sql})`);
    currentRelation = nextCteName;
  }

  if (ctes.length === 0) {
    return `SELECT * FROM ${tableName}`;
  }

  return `WITH ${ctes.join(", ")} SELECT * FROM ${currentRelation}`;
}

function translatePipe(operator: Operator, inputRelation: string): string {
  switch (operator.type) {
    case "where_clause":
      return translateWhere(operator, inputRelation);
    case "project_clause":
      return translateProject(operator, inputRelation);
    case "take_clause":
      return translateTake(operator, inputRelation);
    case "limit_clause":
      return translateLimit(operator, inputRelation);
    case "summarize_clause":
      return translateSummarize(operator, inputRelation);
    case "extend_clause":
      return translateExtend(operator, inputRelation);
    case "sort_clause":
      return translateSort(operator, inputRelation);
    case "distinct_clause":
      return translateDistinct(operator, inputRelation);
    case "join_clause":
      return translateJoin(operator, inputRelation);
    case "top_clause":
      return translateTop(operator, inputRelation);
    default:
      throw new Error(`Unsupported operator: ${operator.type}`);
  }
}

function translateWhere(operator: WhereClause, inputRelation: string): string {
  const condition = translateExpression(operator.expression);
  return `SELECT * FROM ${inputRelation} WHERE ${condition}`;
}

function translateProject(
  operator: ProjectClause,
  inputRelation: string
): string {
  const columns = operator.columns.map(translateColumnExpression).join(", ");
  return `SELECT ${columns} FROM ${inputRelation}`;
}

function translateSummarize(
  operator: SummarizeClause,
  inputRelation: string
): string {
  const aggs = operator.aggregations.map((agg) => {
    const expr = translateExpression(agg.aggregation);
    if (agg.name) {
      return `${expr} AS ${agg.name.name}`;
    }
    return expr;
  });

  const groups = operator.by ? operator.by.map(translateExpression) : [];

  const selectList = [...groups, ...aggs].join(", ");
  const groupBy = groups.length > 0 ? ` GROUP BY ${groups.join(", ")}` : "";

  return `SELECT ${selectList} FROM ${inputRelation}${groupBy}`;
}

function translateTake(operator: TakeClause, inputRelation: string): string {
  return `SELECT * FROM ${inputRelation} LIMIT ${operator.count.value}`;
}

function translateLimit(operator: LimitClause, inputRelation: string): string {
  return `SELECT * FROM ${inputRelation} LIMIT ${operator.count.value}`;
}

function translateExtend(
  operator: ExtendClause,
  inputRelation: string
): string {
  const columns = operator.columns.map(translateColumnExpression).join(", ");
  return `SELECT *, ${columns} FROM ${inputRelation}`;
}

function translateSort(operator: SortClause, inputRelation: string): string {
  const orderBy = operator.expressions.map(translateSortExpression).join(", ");
  return `SELECT * FROM ${inputRelation} ORDER BY ${orderBy}`;
}

function translateSortExpression(expr: SortExpression): string {
  const column = expr.column.name;
  const direction = expr.direction ? expr.direction.toUpperCase() : "ASC";
  return `${column} ${direction}`;
}

function translateDistinct(
  operator: DistinctClause,
  inputRelation: string
): string {
  if (operator.columns && operator.columns.length > 0) {
    const columns = operator.columns.map(translateColumnExpression).join(", ");
    return `SELECT DISTINCT ${columns} FROM ${inputRelation}`;
  }
  return `SELECT DISTINCT * FROM ${inputRelation}`;
}

function translateJoin(operator: JoinClause, inputRelation: string): string {
  const joinKind = operator.kind || "inner";
  const rightTable = operator.rightTable.name;

  // Map KQL join kinds to SQL
  const kindMap: Record<string, string> = {
    inner: "INNER",
    leftouter: "LEFT OUTER",
    rightouter: "RIGHT OUTER",
    fullouter: "FULL OUTER",
    leftanti: "LEFT ANTI",
    rightanti: "RIGHT ANTI",
    leftsemi: "LEFT SEMI",
    rightsemi: "RIGHT SEMI",
  };

  const sqlKind = kindMap[joinKind] || "INNER";

  // Build join conditions
  const onClauses = operator.conditions.map((condition) => {
    const leftCol = condition.left.name;
    const rightCol = condition.right.name;
    return `${inputRelation}.${leftCol} = ${rightTable}.${rightCol}`;
  });

  const onClause = onClauses.join(" AND ");

  return `SELECT * FROM ${inputRelation} ${sqlKind} JOIN ${rightTable} ON ${onClause}`;
}

function translateTop(operator: TopClause, inputRelation: string): string {
  const count = operator.count.value;

  if (operator.by) {
    const column = operator.by.column.name;
    const direction = operator.by.direction
      ? operator.by.direction.toUpperCase()
      : "DESC";
    return `SELECT * FROM ${inputRelation} ORDER BY ${column} ${direction} LIMIT ${count}`;
  }

  return `SELECT * FROM ${inputRelation} LIMIT ${count}`;
}

function translateUnion(operator: UnionClause, sourceTable: string): string {
  const unionKind = operator.kind || "inner";
  const allDuplicates = unionKind === "outer" ? " ALL" : "";

  const tableQueries = [sourceTable, ...operator.tables.map((t) => t.name)].map(
    (table) => `SELECT * FROM ${table}`
  );

  return tableQueries.join(`\nUNION${allDuplicates}\n`);
}

function translateColumnExpression(col: ColumnExpression): string {
  if (col.type === "identifier") {
    return col.name;
  }
  if (col.type === "column_assignment") {
    return `${translateExpression(col.value)} AS ${col.name.name}`;
  }
  throw new Error(`Unsupported column expression type`);
}

function translateExpression(expr: Expression): string {
  switch (expr.type) {
    case "binary_expression":
      return translateBinaryExpression(expr);
    case "comparison_expression":
      return translateComparisonExpression(expr);
    case "arithmetic_expression":
      return translateArithmeticExpression(expr);
    case "string_expression":
      return translateStringExpression(expr);
    case "function_call":
      return translateFunctionCall(expr);
    case "identifier":
      return expr.name;
    case "string_literal":
      return `'${expr.value.replace(/'/g, "''")}'`;
    case "number_literal":
      return expr.value.toString();
    case "boolean_literal":
      return expr.value ? "TRUE" : "FALSE";
    case "null_literal":
      return "NULL";
    default:
      throw new Error(`Unsupported expression type: ${expr.type}`);
  }
}

function translateBinaryExpression(expr: BinaryExpression): string {
  const left = translateExpression(expr.left);
  const right = translateExpression(expr.right);
  return `(${left} ${expr.operator.toUpperCase()} ${right})`;
}

function translateComparisonExpression(expr: ComparisonExpression): string {
  const left =
    expr.left.type === "identifier"
      ? expr.left.name
      : translateExpression(expr.left as Expression);
  const right = translateExpression(expr.right);
  const opMap: Record<string, string> = {
    "==": "=",
    "!=": "!=",
    ">": ">",
    "<": "<",
    ">=": ">=",
    "<=": "<=",
  };
  const op = opMap[expr.operator];
  return `${left} ${op} ${right}`;
}

function translateArithmeticExpression(expr: ArithmeticExpression): string {
  const left = translateExpression(expr.left);
  const right = translateExpression(expr.right);
  return `(${left} ${expr.operator} ${right})`;
}

function translateStringExpression(expr: StringExpression): string {
  const column = expr.left.name;
  const value = translateExpression(expr.right);

  if (expr.operator === "contains") {
    return `${column} LIKE '%' || ${value} || '%'`;
  } else if (expr.operator === "startswith") {
    return `${column} LIKE ${value} || '%'`;
  } else if (expr.operator === "endswith") {
    return `${column} LIKE '%' || ${value}`;
  } else if (expr.operator === "matches") {
    return `${column} REGEXP ${value}`;
  } else if (expr.operator === "has") {
    return `${column} LIKE '%' || ${value} || '%'`;
  }

  return `${column} LIKE ${value}`;
}

function translateFunctionCall(expr: FunctionCall): string {
  const name = expr.name.name.toUpperCase();

  // Handle COUNT(*) special case
  if (name === "COUNT" && expr.arguments.length === 0) {
    return "COUNT(*)";
  }

  // Handle standard aggregation functions (SUM, AVG, MIN, MAX)
  const aggregationFunctions = ["SUM", "AVG", "MIN", "MAX", "COUNT"];
  if (aggregationFunctions.includes(name)) {
    const args = expr.arguments
      .map((arg) => {
        if (arg.type === "named_argument") {
          throw new Error("Named arguments in functions not supported yet");
        }
        return translateExpression(arg);
      })
      .join(", ");

    return `${name}(${args})`;
  }

  // Map KQL functions to DuckDB equivalents
  const functionMap: Record<string, string> = {
    SUBSTRING: "SUBSTR",
    TOLOWER: "LOWER",
    TOUPPER: "UPPER",
    INDEXOF: "STRPOS",
    SPLIT: "STRING_SPLIT",
    REPLACE: "REPLACE",
    LENGTH: "LENGTH",
    TRIM: "TRIM",
    LTRIM: "LTRIM",
    RTRIM: "RTRIM",
    REVERSE: "REVERSE",
  };

  const sqlFunc = functionMap[name] || name;

  // Handle other functions
  const args = expr.arguments
    .map((arg) => {
      if (arg.type === "named_argument") {
        throw new Error("Named arguments in functions not supported yet");
      }
      return translateExpression(arg);
    })
    .join(", ");

  return `${sqlFunc}(${args})`;
}
