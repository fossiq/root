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
  LetStatement,
  MvExpandClause,
  SearchClause,
} from "@fossiq/kql-parser";

// Store let statement values for variable substitution
const variableMap = new Map<string, Expression>();

export function translate(ast: SourceFile): string {
  if (ast.statements.length === 0) {
    return "";
  }

  // Clear variable map for fresh translation
  variableMap.clear();

  // Process all statements
  let queryStatement: QueryStatement | null = null;
  for (const statement of ast.statements) {
    if (statement.type === "let_statement") {
      const letStmt = statement as LetStatement;
      variableMap.set(letStmt.name.name, letStmt.value);
    } else if (statement.type === "query_statement") {
      queryStatement = statement as QueryStatement;
    }
  }

  if (!queryStatement) {
    throw new Error("No query statement found");
  }

  return translateQuery(queryStatement);
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
    case "mv_expand_clause":
      return translateMvExpand(operator, inputRelation);
    case "search_clause":
      return translateSearch(operator, inputRelation);
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

function translateTimespanLiteral(expr: any): string {
  const value = expr.value as string;
  // KQL timespan format: "1d", "2h", "30m", "45s"
  // Convert to DuckDB interval format
  const match = value.match(/^(\d+)([dhms])$/);
  if (!match) {
    return `INTERVAL '${value}'`;
  }

  const amount = match[1];
  const unit = match[2];
  const unitMap: Record<string, string> = {
    d: "day",
    h: "hour",
    m: "minute",
    s: "second",
  };

  return `INTERVAL '${amount} ${unitMap[unit]}'`;
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
    case "identifier": {
      // Check if this is a let variable
      if (variableMap.has(expr.name)) {
        const varValue = variableMap.get(expr.name)!;
        return `(${translateExpression(varValue)})`;
      }
      return expr.name;
    }
    case "string_literal":
      return `'${expr.value.replace(/'/g, "''")}'`;
    case "number_literal":
      return expr.value.toString();
    case "boolean_literal":
      return expr.value ? "TRUE" : "FALSE";
    case "null_literal":
      return "NULL";
    case "timespan_literal":
      return translateTimespanLiteral(expr);
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
    ROUND: "ROUND",
    FLOOR: "FLOOR",
    CEIL: "CEIL",
    ABS: "ABS",
    SQRT: "SQRT",
    POW: "POW",
    LOG: "LOG",
    LOG10: "LOG10",
    EXP: "EXP",
    SIN: "SIN",
    COS: "COS",
    TAN: "TAN",
    TOSTRING: "CAST",
    TOINT: "CAST",
    TODOUBLE: "CAST",
    TOBOOL: "CAST",
    TOLONG: "CAST",
    TOFLOAT: "CAST",
    TODATETIME: "CAST",
    TOTIMESPAN: "CAST",
    NOW: "NOW",
    AGO: "AGO",
  };

  const sqlFunc = functionMap[name] || name;

  // Handle type conversion functions specially
  const typeMap: Record<string, string> = {
    TOSTRING: "VARCHAR",
    TOINT: "INTEGER",
    TODOUBLE: "DOUBLE",
    TOBOOL: "BOOLEAN",
    TOLONG: "BIGINT",
    TOFLOAT: "FLOAT",
    TODATETIME: "TIMESTAMP",
    TOTIMESPAN: "INTERVAL",
  };

  if (typeMap[name]) {
    const arg = expr.arguments[0];
    if (arg?.type === "named_argument") {
      throw new Error("Named arguments in functions not supported yet");
    }
    const argExpr = arg ? translateExpression(arg) : "";
    return `CAST(${argExpr} AS ${typeMap[name]})`;
  }

  // Handle AGO function specially
  if (name === "AGO") {
    const arg = expr.arguments[0];
    if (!arg) return "NOW()";
    if (arg.type === "named_argument") {
      throw new Error("Named arguments in AGO function not supported");
    }
    const timespan = translateExpression(arg as Expression);
    // timespan already includes INTERVAL, so just subtract it
    return `NOW() - ${timespan}`;
  }

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

function translateMvExpand(
  operator: MvExpandClause,
  inputRelation: string
): string {
  // Translate the column expression to expand
  const columnExpr = translateExpression(operator.column as Expression);

  // Build the UNNEST clause
  // DuckDB uses UNNEST() to expand arrays/multi-valued columns
  let sql = `SELECT * FROM ${inputRelation}, UNNEST(${columnExpr}) AS expanded_value`;

  // Add LIMIT clause if specified
  if (operator.limit) {
    sql += ` LIMIT ${operator.limit.value}`;
  }

  return sql;
}

function translateSearch(
  operator: SearchClause,
  inputRelation: string
): string {
  const searchTerm = `'%${operator.term.value}%'`;

  // If specific columns are provided, search only those columns
  if (operator.columns && operator.columns.length > 0) {
    const columnConditions = operator.columns
      .map((col) => {
        const colName = col.type === "identifier" ? col.name : col.name.name;
        return `LOWER(${colName}) LIKE LOWER(${searchTerm})`;
      })
      .join(" OR ");
    return `SELECT * FROM ${inputRelation} WHERE ${columnConditions}`;
  }

  // If no columns specified, we need to search all columns
  // For now, we'll throw an error as we don't have column metadata
  // In practice, you might want to use a more generic approach
  throw new Error(
    "Search without specific columns requires schema metadata. Please specify columns: search in (col1, col2) 'term'"
  );
}
