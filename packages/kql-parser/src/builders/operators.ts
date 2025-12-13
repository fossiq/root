import type { SyntaxNode } from "tree-sitter";
import type {
  WhereClause,
  ProjectClause,
  ExtendClause,
  SummarizeClause,
  AggregationExpression,
  JoinClause,
  JoinCondition,
  JoinKind,
  UnionClause,
  UnionKind,
  ParseClause,
  ParseKind,
  MvExpandClause,
  TakeClause,
  LimitClause,
  SortClause,
  SortExpression,
  DistinctClause,
  CountClause,
  TopClause,
  SearchClause,
  ColumnExpression,
  ColumnAssignment,
  Expression,
  Identifier,
  ASTNode,
  NumberLiteral,
  ProjectReorderClause,
  ProjectRenameClause,
  ProjectAwayClause,
  ProjectKeepClause,
} from "../types.js";
import {
  buildIdentifier,
  buildNumberLiteral,
  buildStringLiteral,
} from "./literals.js";

export function buildWhereClause(
  node: SyntaxNode,
  buildAST: (node: SyntaxNode) => ASTNode
): WhereClause {
  const expr = node.children.find((c) => c.type !== "where");
  if (!expr) {
    throw new Error("Where clause missing expression");
  }
  return {
    type: "where_clause",
    expression: buildAST(expr) as Expression,
  };
}

function buildColumnExpressions(
  columnList: SyntaxNode,
  buildAST: (node: SyntaxNode) => ASTNode
): ColumnExpression[] {
  const columns: ColumnExpression[] = [];
  for (let i = 0; i < columnList.childCount; i++) {
    const child = columnList.child(i);
    if (
      child &&
      (child.type === "column_expression" ||
        child.type === "identifier" ||
        child.type === "column_assignment")
    ) {
      const colExpr =
        child.type === "column_expression" ? child.child(0) : child;
      if (colExpr) {
        const ast = buildAST(colExpr);
        if (ast.type === "identifier" || ast.type === "column_assignment") {
          columns.push(ast);
        }
      }
    }
  }
  return columns;
}

export function buildProjectClause(
  node: SyntaxNode,
  buildAST: (node: SyntaxNode) => ASTNode
): ProjectClause {
  const columnList = node.children.find((c) => c.type === "column_list");
  if (!columnList) {
    throw new Error("Project clause missing column list");
  }
  return {
    type: "project_clause",
    columns: buildColumnExpressions(columnList, buildAST),
  };
}

export function buildExtendClause(
  node: SyntaxNode,
  buildAST: (node: SyntaxNode) => ASTNode
): ExtendClause {
  const columnList = node.children.find((c) => c.type === "column_list");
  if (!columnList) {
    throw new Error("Extend clause missing column list");
  }

  return {
    type: "extend_clause",
    columns: buildColumnExpressions(columnList, buildAST),
  };
}

export function buildSummarizeClause(
  node: SyntaxNode,
  buildAST: (node: SyntaxNode) => ASTNode
): SummarizeClause {
  const aggregationList = node.children.find(
    (c) => c.type === "aggregation_list"
  );
  if (!aggregationList) {
    throw new Error("Summarize clause missing aggregation list");
  }

  const aggregations: AggregationExpression[] = [];
  for (let i = 0; i < aggregationList.childCount; i++) {
    const child = aggregationList.child(i);
    if (child && child.type === "aggregation_expression") {
      aggregations.push(buildAggregationExpression(child, buildAST));
    }
  }

  const byIndex = node.children.findIndex((c) => c.text === "by");
  let byExpressions: Expression[] | undefined;

  if (byIndex !== -1) {
    const expressionList = node.children[byIndex + 1];
    if (expressionList && expressionList.type === "expression_list") {
      byExpressions = [];
      for (let i = 0; i < expressionList.childCount; i++) {
        const child = expressionList.child(i);
        if (child && child.type !== ",") {
          byExpressions.push(buildAST(child) as Expression);
        }
      }
    }
  }

  return {
    type: "summarize_clause",
    aggregations,
    by: byExpressions,
  };
}

export function buildAggregationExpression(
  node: SyntaxNode,
  buildAST: (node: SyntaxNode) => ASTNode
): AggregationExpression {
  // Check if it's a named aggregation (identifier = expression)
  const hasAssignment = node.children.some((c) => c.text === "=");

  if (hasAssignment) {
    const name = node.child(0);
    const value = node.child(2);

    if (!name || !value) {
      throw new Error("Aggregation expression missing name or value");
    }

    return {
      type: "aggregation_expression",
      name: buildIdentifier(name),
      aggregation: buildAST(value) as Expression,
    };
  }

  // Unnamed aggregation - just an expression
  const expr = node.child(0);
  if (!expr) {
    throw new Error("Aggregation expression missing expression");
  }

  return {
    type: "aggregation_expression",
    aggregation: buildAST(expr) as Expression,
  };
}

export function buildJoinClause(node: SyntaxNode): JoinClause {
  // Find join kind (optional)
  let kind: JoinKind | undefined;
  const kindNode = node.children.find((c) => c.type === "join_kind");
  if (kindNode) {
    kind = kindNode.text as JoinKind;
  }

  // Find right table
  const tableNode = node.children.find((c) => c.type === "table_name");
  if (!tableNode) {
    throw new Error("Join clause missing right table");
  }

  // Find join conditions
  const conditionsNode = node.children.find(
    (c) => c.type === "join_conditions"
  );
  if (!conditionsNode) {
    throw new Error("Join clause missing conditions");
  }

  const conditions: JoinCondition[] = [];
  for (let i = 0; i < conditionsNode.childCount; i++) {
    const child = conditionsNode.child(i);
    if (child && child.type === "join_condition") {
      conditions.push(buildJoinCondition(child));
    }
  }

  return {
    type: "join_clause",
    kind,
    rightTable: buildIdentifier(tableNode),
    conditions,
  };
}

export function buildJoinCondition(node: SyntaxNode): JoinCondition {
  // Handle simple column name case (just identifier)
  if (node.childCount === 1 && node.child(0)?.type === "identifier") {
    const id = buildIdentifier(node.child(0)!);
    return {
      type: "join_condition",
      left: id,
      right: id,
    };
  }

  // Handle $left.col == $right.col or col1 == col2 case
  let leftId: SyntaxNode | null = null;
  let rightId: SyntaxNode | null = null;

  // Find identifiers around the == operator
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (child && child.type === "identifier") {
      if (!leftId) {
        leftId = child;
      } else if (!rightId) {
        rightId = child;
        break;
      }
    }
  }

  if (!leftId || !rightId) {
    throw new Error("Join condition missing identifiers");
  }

  return {
    type: "join_condition",
    left: buildIdentifier(leftId),
    right: buildIdentifier(rightId),
  };
}

export function buildColumnAssignment(
  node: SyntaxNode,
  buildAST: (node: SyntaxNode) => ASTNode
): ColumnAssignment {
  const name = node.child(0);
  const value = node.child(2);

  if (!name || !value) {
    throw new Error("Column assignment missing name or value");
  }

  return {
    type: "column_assignment",
    name: buildIdentifier(name),
    value: buildAST(value) as Expression,
  };
}

export function buildUnionClause(node: SyntaxNode): UnionClause {
  // Find union kind (optional)
  let kind: UnionKind | undefined;
  const kindNode = node.children.find((c) => c.type === "union_kind");
  if (kindNode) {
    kind = kindNode.text as UnionKind;
  }

  // Find isfuzzy (optional)
  let isfuzzy: boolean | undefined;
  const isfuzzyIndex = node.children.findIndex((c) => c.text === "isfuzzy");
  if (isfuzzyIndex !== -1) {
    const boolValue = node.children[isfuzzyIndex + 2]; // skip '='
    if (
      boolValue &&
      (boolValue.text === "true" || boolValue.text === "false")
    ) {
      isfuzzy = boolValue.text === "true";
    }
  }

  // Find table list
  const tableListNode = node.children.find((c) => c.type === "table_list");
  if (!tableListNode) {
    throw new Error("Union clause missing table list");
  }

  const tables: Identifier[] = [];
  for (let i = 0; i < tableListNode.childCount; i++) {
    const child = tableListNode.child(i);
    if (child && child.type === "table_name") {
      tables.push(buildIdentifier(child));
    }
  }

  return {
    type: "union_clause",
    kind,
    isfuzzy,
    tables,
  };
}

export function buildParseClause(
  node: SyntaxNode,
  buildAST: (node: SyntaxNode) => ASTNode
): ParseClause {
  // Find parse kind (optional)
  let kind: ParseKind | undefined;
  const kindNode = node.children.find((c) => c.type === "parse_kind");
  if (kindNode) {
    kind = kindNode.text as ParseKind;
  }

  // Find source expression
  const sourceNode = node.children.find(
    (c) => c.type === "expression" || c.type === "identifier"
  );
  if (!sourceNode) {
    throw new Error("Parse clause missing source expression");
  }

  // Find pattern string
  const patternNode = node.children.find((c) => c.type === "string_literal");
  if (!patternNode) {
    throw new Error("Parse clause missing pattern");
  }

  return {
    type: "parse_clause",
    kind,
    source: buildAST(sourceNode) as Expression,
    pattern: buildStringLiteral(patternNode),
  };
}

export function buildMvExpandClause(
  node: SyntaxNode,
  buildAST: (node: SyntaxNode) => ASTNode
): MvExpandClause {
  // Find column expression to expand
  const columnNode = node.children.find(
    (c) => c.type === "expression" || c.type === "identifier"
  );
  if (!columnNode) {
    throw new Error("MV-expand clause missing column expression");
  }

  // Find 'to typeof' clause (optional)
  let toIdentifier: Identifier | undefined;
  const toIndex = node.children.findIndex((c) => c.text === "to");
  if (toIndex !== -1) {
    // Look for identifier after 'typeof' and '('
    for (let i = toIndex + 1; i < node.children.length; i++) {
      const child = node.children[i];
      if (child && child.type === "identifier") {
        toIdentifier = buildIdentifier(child);
        break;
      }
    }
  }

  // Find limit (optional)
  let limit: NumberLiteral | undefined = undefined;
  const limitIndex = node.children.findIndex((c) => c.text === "limit");
  if (limitIndex !== -1) {
    const limitNode = node.children[limitIndex + 1];
    if (limitNode && limitNode.type === "number_literal") {
      limit = buildNumberLiteral(limitNode);
    }
  }

  return {
    type: "mv_expand_clause",
    column: buildAST(columnNode) as Expression,
    to: toIdentifier,
    limit,
  };
}

export function buildTakeClause(node: SyntaxNode): TakeClause {
  const count = node.children.find((c) => c.type === "number_literal");
  if (!count) {
    throw new Error("Take clause missing count");
  }
  return {
    type: "take_clause",
    count: buildNumberLiteral(count),
  };
}

export function buildLimitClause(node: SyntaxNode): LimitClause {
  const count = node.children.find((c) => c.type === "number_literal");
  if (!count) {
    throw new Error("Limit clause missing count");
  }
  return {
    type: "limit_clause",
    count: buildNumberLiteral(count),
  };
}

export function buildSortClause(node: SyntaxNode): SortClause {
  const sortList = node.children.find((c) => c.type === "sort_expression_list");
  if (!sortList) {
    throw new Error("Sort clause missing expression list");
  }

  const expressions: SortExpression[] = [];
  for (let i = 0; i < sortList.childCount; i++) {
    const child = sortList.child(i);
    if (child && child.type === "sort_expression") {
      expressions.push(buildSortExpression(child));
    }
  }

  return {
    type: "sort_clause",
    expressions,
  };
}

export function buildSortExpression(node: SyntaxNode): SortExpression {
  const column = node.children.find((c) => c.type === "identifier");
  if (!column) {
    throw new Error("Sort expression missing column identifier");
  }

  const direction = node.children.find(
    (c) => c.text === "asc" || c.text === "desc"
  );

  return {
    type: "sort_expression",
    column: buildIdentifier(column),
    direction: direction?.text as "asc" | "desc" | undefined,
  };
}

export function buildDistinctClause(
  node: SyntaxNode,
  buildAST: (node: SyntaxNode) => ASTNode
): DistinctClause {
  const columnList = node.children.find((c) => c.type === "column_list");

  if (!columnList) {
    return {
      type: "distinct_clause",
    };
  }

  const columns: ColumnExpression[] = [];
  for (let i = 0; i < columnList.childCount; i++) {
    const child = columnList.child(i);
    if (
      child &&
      (child.type === "column_expression" ||
        child.type === "identifier" ||
        child.type === "column_assignment")
    ) {
      const colExpr =
        child.type === "column_expression" ? child.child(0) : child;
      if (colExpr) {
        const ast = buildAST(colExpr);
        if (ast.type === "identifier" || ast.type === "column_assignment") {
          columns.push(ast);
        }
      }
    }
  }

  return {
    type: "distinct_clause",
    columns,
  };
}

export function buildCountClause(_node: SyntaxNode): CountClause {
  return {
    type: "count_clause",
  };
}

export function buildTopClause(node: SyntaxNode): TopClause {
  const count = node.children.find((c) => c.type === "number_literal");
  if (!count) {
    throw new Error("Top clause missing count");
  }

  const byIndex = node.children.findIndex((c) => c.text === "by");
  if (byIndex !== -1) {
    const column = node.children[byIndex + 1];
    const direction = node.children[byIndex + 2];

    if (column && column.type === "identifier") {
      return {
        type: "top_clause",
        count: buildNumberLiteral(count),
        by: {
          column: buildIdentifier(column),
          direction:
            direction?.text === "asc" || direction?.text === "desc"
              ? direction.text
              : undefined,
        },
      };
    }
  }

  return {
    type: "top_clause",
    count: buildNumberLiteral(count),
  };
}

export function buildProjectAwayClause(
  node: SyntaxNode,
  buildAST: (node: SyntaxNode) => ASTNode
): ProjectAwayClause {
  const columnList = node.children.find((c) => c.type === "column_list");
  if (!columnList) {
    throw new Error("Project-away clause missing column list");
  }
  return {
    type: "project_away_clause",
    columns: buildColumnExpressions(columnList, buildAST),
  };
}

export function buildProjectKeepClause(
  node: SyntaxNode,
  buildAST: (node: SyntaxNode) => ASTNode
): ProjectKeepClause {
  const columnList = node.children.find((c) => c.type === "column_list");
  if (!columnList) {
    throw new Error("Project-keep clause missing column list");
  }
  return {
    type: "project_keep_clause",
    columns: buildColumnExpressions(columnList, buildAST),
  };
}

export function buildProjectRenameClause(
  node: SyntaxNode,
  buildAST: (node: SyntaxNode) => ASTNode
): ProjectRenameClause {
  const columnList = node.children.find((c) => c.type === "column_list");
  if (!columnList) {
    throw new Error("Project-rename clause missing column list");
  }

  const columns = buildColumnExpressions(columnList, buildAST);
  for (const col of columns) {
    if (col.type !== "column_assignment") {
      throw new Error("project-rename requires new = old assignments");
    }
  }

  return {
    type: "project_rename_clause",
    columns: columns as ColumnAssignment[],
  };
}

export function buildProjectReorderClause(
  node: SyntaxNode,
  buildAST: (node: SyntaxNode) => ASTNode
): ProjectReorderClause {
  const columnList = node.children.find((c) => c.type === "column_list");
  if (!columnList) {
    throw new Error("Project-reorder clause missing column list");
  }
  return {
    type: "project_reorder_clause",
    columns: buildColumnExpressions(columnList, buildAST),
  };
}

export function buildSearchClause(
  node: SyntaxNode,
  buildAST: (node: SyntaxNode) => ASTNode
): SearchClause {
  const stringLiteral = node.children.find((c) => c.type === "string_literal");
  if (!stringLiteral) {
    throw new Error("Search clause missing search term");
  }

  const columnList = node.children.find((c) => c.type === "column_list");
  if (!columnList) {
    return {
      type: "search_clause",
      term: buildStringLiteral(stringLiteral),
    };
  }

  const columns: ColumnExpression[] = [];
  for (let i = 0; i < columnList.childCount; i++) {
    const child = columnList.child(i);
    if (
      child &&
      (child.type === "column_expression" ||
        child.type === "identifier" ||
        child.type === "column_assignment")
    ) {
      const colExpr =
        child.type === "column_expression" ? child.child(0) : child;
      if (colExpr) {
        const ast = buildAST(colExpr);
        if (ast.type === "identifier" || ast.type === "column_assignment") {
          columns.push(ast);
        }
      }
    }
  }

  return {
    type: "search_clause",
    columns,
    term: buildStringLiteral(stringLiteral),
  };
}
