import type {
  Expression,
  BinaryExpression,
  FunctionCall,
  Identifier,
  NumberLiteral,
  StringLiteral,
  Literal,
  ParenthesizedExpression,
  UnaryExpression,
  ArrayLiteral,
} from "@fossiq/kql-ast";

export function translateExpression(expr: Expression): string {
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
    case "ArrayLiteral":
      return translateArrayLiteral(expr as ArrayLiteral);
    default:
      throw new Error(
        `Unsupported expression type: ${
          (expr as Expression & { type: string }).type
        }`
      );
  }
}

function translateArrayLiteral(expr: ArrayLiteral): string {
  const elements = expr.elements.map(translateExpression).join(", ");
  return `(${elements})`;
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
  } else if (operator === "!contains") {
    const right =
      expr.right.type === "StringLiteral"
        ? `'%${(expr.right as StringLiteral).value}%'`
        : `'%' || ${translateExpression(expr.right)} || '%'`;
    return `${left} NOT LIKE ${right}`;
  } else if (operator === "startswith") {
    const right =
      expr.right.type === "StringLiteral"
        ? `'${(expr.right as StringLiteral).value}%'`
        : `${translateExpression(expr.right)} || '%'`;
    return `${left} LIKE ${right}`;
  } else if (operator === "!startswith") {
    const right =
      expr.right.type === "StringLiteral"
        ? `'${(expr.right as StringLiteral).value}%'`
        : `${translateExpression(expr.right)} || '%'`;
    return `${left} NOT LIKE ${right}`;
  } else if (operator === "endswith") {
    const right =
      expr.right.type === "StringLiteral"
        ? `'%${(expr.right as StringLiteral).value}'`
        : `'%' || ${translateExpression(expr.right)}`;
    return `${left} LIKE ${right}`;
  } else if (operator === "!endswith") {
    const right =
      expr.right.type === "StringLiteral"
        ? `'%${(expr.right as StringLiteral).value}'`
        : `'%' || ${translateExpression(expr.right)}`;
    return `${left} NOT LIKE ${right}`;
  } else if (operator === "has") {
    // 'has' in KQL means word boundary match - approximate with REGEXP
    const right =
      expr.right.type === "StringLiteral"
        ? `'\\b${(expr.right as StringLiteral).value}\\b'`
        : translateExpression(expr.right);
    return `${left} REGEXP ${right}`;
  } else if (operator === "!has") {
    const right =
      expr.right.type === "StringLiteral"
        ? `'\\b${(expr.right as StringLiteral).value}\\b'`
        : translateExpression(expr.right);
    return `${left} NOT REGEXP ${right}`;
  } else if (operator.replace(/\s+/g, " ").trim() === "matches regex") {
    const right = translateExpression(expr.right);
    return `regexp_matches(${left}, ${right})`;
  } else if (operator === "in") {
    const right = translateExpression(expr.right);
    return `${left} IN ${right}`;
  } else if (operator === "!in") {
    const right = translateExpression(expr.right);
    return `${left} NOT IN ${right}`;
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
