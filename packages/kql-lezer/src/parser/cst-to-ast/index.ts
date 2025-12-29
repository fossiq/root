import { Tree, SyntaxNode } from "@lezer/common";
import { CstToAstContext } from "./context";
import { mapWhereOperator } from "./operators/where";
import type * as AST from "@fossiq/kql-ast";

/**
 * Convert a Lezer parse tree (CST) to a KQL AST.
 *
 * This is the main entry point for CST-to-AST conversion.
 * It walks the Lezer syntax tree and dispatches to appropriate
 * mappers based on node types.
 */
export function cstToAst(tree: Tree, text: string): AST.Query | AST.ErrorNode {
  const ctx = new CstToAstContext(text);
  const topNode = tree.topNode;

  // The top node is "KQL", which contains "Query"
  if (topNode.type.name !== "KQL") {
    return ctx.errorNode(
      topNode,
      `Expected KQL node, got ${topNode.type.name}`
    );
  }

  const queryNode = ctx.getChild(topNode, "Query");
  if (!queryNode) {
    return ctx.errorNode(topNode, "KQL missing Query node");
  }

  return mapQuery(queryNode, ctx);
}

/**
 * Map the top-level Query node.
 *
 * Grammar structure:
 *   Query { LetStatement* QueryExpression }
 *   QueryExpression { UnionExpression | SearchExpression | FindExpression | PipelineExpression }
 */
function mapQuery(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.Query | AST.ErrorNode {
  const letStatements: AST.LetStatement[] = [];
  const letNodes = ctx.getChildren(node, "LetStatement");

  for (const letNode of letNodes) {
    const letStmt = mapLetStatement(letNode, ctx);
    if (letStmt.type === "ErrorNode") {
      return letStmt;
    }
    letStatements.push(letStmt);
  }

  // Get the QueryExpression which wraps the actual expression type
  const queryExprNode = ctx.getChild(node, "QueryExpression");
  if (!queryExprNode) {
    return ctx.errorNode(node, "Query missing QueryExpression");
  }

  // Determine the type of the inner expression
  const firstChild = queryExprNode.firstChild;
  if (!firstChild) {
    return ctx.errorNode(queryExprNode, "Empty QueryExpression");
  }

  let expression: AST.QueryExpression | AST.ErrorNode;

  switch (firstChild.type.name) {
    case "PipelineExpression":
      expression = mapPipelineExpression(firstChild, ctx);
      break;
    case "UnionExpression":
      expression = mapUnionExpression(firstChild, ctx);
      break;
    case "SearchExpression":
      expression = mapSearchExpression(firstChild, ctx);
      break;
    case "FindExpression":
      expression = mapFindExpression(firstChild, ctx);
      break;
    default:
      return ctx.errorNode(
        firstChild,
        `Unsupported query expression type: ${firstChild.type.name}`
      );
  }

  if (expression.type === "ErrorNode") {
    return expression as AST.ErrorNode;
  }

  // Construct the Query object
  // For backward compatibility, if it's a pipeline, we also set the pipeline field
  const query: AST.Query = {
    type: "Query",
    letStatements,
    expression: expression as AST.QueryExpression,
    start: node.from,
    end: node.to,
  };

  if (expression.type === "PipelineExpression") {
    query.pipeline = expression as AST.PipelineExpression;
  }

  return query;
}

/**
 * Map a LetStatement node.
 *
 * Grammar structure:
 *   LetStatement: "let" Identifier "=" Expression ";"
 */
function mapLetStatement(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.LetStatement | AST.ErrorNode {
  const identifierNode = ctx.getChild(node, "Identifier");
  if (!identifierNode) {
    return ctx.errorNode(node, "LetStatement missing identifier");
  }

  const exprNode = ctx.getChild(node, "Expression");
  if (!exprNode) {
    return ctx.errorNode(node, "LetStatement missing expression");
  }

  const name = ctx.slice(identifierNode);
  const value = ctx.mapScalarExpression(exprNode);

  return {
    type: "LetStatement",
    name,
    value,
    start: node.from,
    end: node.to,
  };
}

/**
 * Map a PipelineExpression node.
 *
 * Grammar structure:
 *   PipelineExpression { TableExpression (Pipe TabularOperator)* }
 */
function mapPipelineExpression(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.PipelineExpression | AST.ErrorNode {
  const tableNode = ctx.getChild(node, "TableExpression");
  if (!tableNode) {
    return ctx.errorNode(node, "PipelineExpression missing TableExpression");
  }

  const source = mapTableExpression(tableNode, ctx);
  if (source.type === "ErrorNode") {
    return source;
  }

  // Collect all TabularOperator nodes (they wrap the actual operator clauses)
  const operators: AST.TabularOperator[] = [];
  const tabularOpNodes = ctx.getChildren(node, "TabularOperator");

  for (const tabularOpNode of tabularOpNodes) {
    const op = mapTabularOperator(tabularOpNode, ctx);
    if (op.type === "ErrorNode") {
      return op;
    }
    operators.push(op);
  }

  return {
    type: "PipelineExpression",
    source,
    operators,
    start: node.from,
    end: node.to,
  };
}

/**
 * Map a UnionExpression node (top-level).
 * Grammar: UnionExpression { kw<"union"> UnionModifiers? TableList }
 */
function mapUnionExpression(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.UnionExpression | AST.ErrorNode {
  const tableList = ctx.getChild(node, "TableList");
  if (!tableList) {
    return ctx.errorNode(node, "UnionExpression missing table list");
  }

  const tables: (AST.TableReference | AST.PipelineExpression)[] = [];
  const tableNodes = ctx.getChildren(tableList, "TableExpression");

  for (const tableNode of tableNodes) {
    const table = mapTableExpression(tableNode, ctx);
    if (table.type === "ErrorNode") {
      return table;
    }
    tables.push(table);
  }

  return {
    type: "UnionExpression",
    tables,
    start: node.from,
    end: node.to,
  };
}

/**
 * Map a SearchExpression node.
 * Grammar: SearchExpression { kw<"search"> ... }
 */
function mapSearchExpression(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.SearchExpression | AST.ErrorNode {
  // Placeholder implementation
  return {
    type: "SearchExpression",
    start: node.from,
    end: node.to,
  };
}

/**
 * Map a FindExpression node.
 * Grammar: FindExpression { kw<"find"> ... }
 */
function mapFindExpression(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.FindExpression | AST.ErrorNode {
  // Placeholder implementation
  return {
    type: "FindExpression",
    start: node.from,
    end: node.to,
  };
}

/**
 * Map a TabularOperator node.
 * This is a wrapper node that contains the actual operator clause.
 *
 * Grammar structure:
 *   TabularOperator { WhereClause | ProjectClause | ... }
 */
function mapTabularOperator(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.TabularOperator | AST.ErrorNode {
  const child = node.firstChild;
  if (!child) {
    return ctx.errorNode(node, "Empty TabularOperator");
  }

  switch (child.type.name) {
    case "WhereClause":
      return mapWhereOperator(child, ctx);

    case "ProjectClause":
      return mapProjectClause(child, ctx);

    case "ProjectAwayClause":
    case "ProjectKeepClause":
    case "ProjectReorderClause":
      return mapProjectVariant(child, ctx);

    case "ProjectRenameClause":
      return mapProjectRenameClause(child, ctx);

    case "ExtendClause":
      return mapExtendClause(child, ctx);

    case "SortClause":
      return mapSortClause(child, ctx);

    case "LimitClause":
    case "TakeClause":
      return mapLimitClause(child, ctx);

    case "TopClause":
      return mapTopClause(child, ctx);

    case "DistinctClause":
      return mapDistinctClause(child, ctx);

    case "SummarizeClause":
      return mapSummarizeClause(child, ctx);

    case "MvExpandClause":
      return mapMvExpandClause(child, ctx);

    case "UnionClause":
      return mapUnionClause(child, ctx);

    default:
      return ctx.errorNode(
        child,
        `Unsupported tabular operator: ${child.type.name}`
      );
  }
}

/**
 * Map a TableExpression node.
 *
 * Grammar structure:
 *   TableExpression: Identifier | BracketedIdentifier | "(" PipelineExpression ")"
 */
function mapTableExpression(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.TableReference | AST.PipelineExpression | AST.ErrorNode {
  const child = node.firstChild;
  if (!child) {
    return ctx.errorNode(node, "Empty TableExpression");
  }

  if (child.type.name === "Identifier") {
    return {
      type: "TableReference",
      name: ctx.slice(child),
      start: child.from,
      end: child.to,
    };
  }

  if (child.type.name === "BracketedIdentifier") {
    // Extract the string from ['name']
    const stringNode = ctx.getChild(child, "String");
    const name = stringNode
      ? ctx.parseStringLiteral(ctx.slice(stringNode))
      : ctx.slice(child);
    return {
      type: "TableReference",
      name,
      start: child.from,
      end: child.to,
    };
  }

  if (child.type.name === "OpenParen") {
    // Parenthesized pipeline expression
    const innerPipeline = child.nextSibling;
    if (innerPipeline && innerPipeline.type.name === "PipelineExpression") {
      return mapPipelineExpression(innerPipeline, ctx);
    }
    return ctx.errorNode(node, "Invalid parenthesized table expression");
  }

  return ctx.errorNode(
    child,
    `Unsupported table expression: ${child.type.name}`
  );
}

// ============================================================================
// Operator Mappers
// ============================================================================

/**
 * Map a ProjectClause to AST.
 * Grammar: kw<"project"> ProjectExpressionList
 */
function mapProjectClause(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.TabularOperator | AST.ErrorNode {
  const columns = mapProjectExpressionList(node, ctx);
  return {
    type: "ProjectOperator",
    columns,
    start: node.from,
    end: node.to,
  };
}

/**
 * Map ProjectExpressionList to column expressions.
 */
function mapProjectExpressionList(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.ProjectColumn[] {
  const columns: AST.ProjectColumn[] = [];
  const listNode = ctx.getChild(node, "ProjectExpressionList");
  if (!listNode) return columns;

  const items = ctx.getChildren(listNode, "ProjectExpressionItem");
  for (const item of items) {
    const column = mapProjectExpressionItem(item, ctx);
    columns.push(column);
  }
  return columns;
}

/**
 * Map a single ProjectExpressionItem.
 * Grammar: (Identifier Equals)? Expression
 */
function mapProjectExpressionItem(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.ProjectColumn {
  const identNode = ctx.getChild(node, "Identifier");
  const exprNode = ctx.getChild(node, "Expression");

  // Check if there's an alias (Identifier = Expression)
  const equalsNode = ctx.getChild(node, "Equals");

  if (identNode && equalsNode && exprNode) {
    // Aliased: name = expr
    return {
      type: "ProjectColumn",
      alias: ctx.slice(identNode),
      expression: ctx.mapScalarExpression(exprNode),
      start: node.from,
      end: node.to,
    };
  } else if (exprNode) {
    // Just expression
    return {
      type: "ProjectColumn",
      expression: ctx.mapScalarExpression(exprNode),
      start: node.from,
      end: node.to,
    };
  } else if (identNode) {
    // Just identifier
    return {
      type: "ProjectColumn",
      expression: {
        type: "Identifier",
        name: ctx.slice(identNode),
        start: identNode.from,
        end: identNode.to,
      },
      start: node.from,
      end: node.to,
    };
  }

  return {
    type: "ProjectColumn",
    expression: ctx.errorNode(node, "Invalid project item"),
    start: node.from,
    end: node.to,
  };
}

/**
 * Map project-away, project-keep, project-reorder variants.
 */
function mapProjectVariant(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.TabularOperator | AST.ErrorNode {
  const columns = mapIdentifierList(node, ctx);
  const operatorType = node.type.name.replace("Clause", "Operator");

  return {
    type: operatorType as
      | "ProjectAwayOperator"
      | "ProjectKeepOperator"
      | "ProjectReorderOperator",
    columns,
    start: node.from,
    end: node.to,
  };
}

/**
 * Map project-rename clause.
 */
function mapProjectRenameClause(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.TabularOperator | AST.ErrorNode {
  const renames: { newName: string; oldName: string }[] = [];
  const listNode = ctx.getChild(node, "ProjectRenameList");
  if (listNode) {
    const items = ctx.getChildren(listNode, "ProjectRenameItem");
    for (const item of items) {
      const identifiers = ctx.getChildren(item, "Identifier");
      if (identifiers.length >= 2) {
        renames.push({
          newName: ctx.slice(identifiers[0]),
          oldName: ctx.slice(identifiers[1]),
        });
      }
    }
  }

  return {
    type: "ProjectRenameOperator",
    renames,
    start: node.from,
    end: node.to,
  };
}

/**
 * Map extend clause.
 */
function mapExtendClause(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.TabularOperator | AST.ErrorNode {
  const columns = mapProjectExpressionList(node, ctx);
  return {
    type: "ExtendOperator",
    columns,
    start: node.from,
    end: node.to,
  };
}

/**
 * Map sort/order clause.
 */
function mapSortClause(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.TabularOperator | AST.ErrorNode {
  const expressions: AST.SortExpression[] = [];
  const listNode = ctx.getChild(node, "SortExpressionList");
  if (listNode) {
    const items = ctx.getChildren(listNode, "SortExpressionItem");
    for (const item of items) {
      const exprNode = ctx.getChild(item, "Expression");
      const dirNode = ctx.getChild(item, "SortDirection");
      const nullsNode = ctx.getChild(item, "NullsPosition");

      expressions.push({
        type: "SortExpression",
        expression: exprNode
          ? ctx.mapScalarExpression(exprNode)
          : ctx.errorNode(item, "Missing sort expression"),
        direction: dirNode ? ctx.slice(dirNode) : undefined,
        nulls: nullsNode ? ctx.slice(nullsNode) : undefined,
        start: item.from,
        end: item.to,
      });
    }
  }

  return {
    type: "SortOperator",
    expressions,
    start: node.from,
    end: node.to,
  };
}

/**
 * Map limit/take clause.
 */
function mapLimitClause(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.TabularOperator | AST.ErrorNode {
  const exprNode = ctx.getChild(node, "Expression");
  return {
    type: node.type.name === "LimitClause" ? "LimitOperator" : "TakeOperator",
    count: exprNode
      ? ctx.mapScalarExpression(exprNode)
      : ctx.errorNode(node, "Missing limit expression"),
    start: node.from,
    end: node.to,
  };
}

/**
 * Map top clause.
 */
function mapTopClause(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.TabularOperator | AST.ErrorNode {
  const exprNode = ctx.getChild(node, "Expression");
  const sortList = ctx.getChild(node, "SortExpressionList");

  const byExpressions: AST.SortExpression[] = [];
  if (sortList) {
    const items = ctx.getChildren(sortList, "SortExpressionItem");
    for (const item of items) {
      const itemExpr = ctx.getChild(item, "Expression");
      const dirNode = ctx.getChild(item, "SortDirection");
      const nullsNode = ctx.getChild(item, "NullsPosition");

      byExpressions.push({
        type: "SortExpression",
        expression: itemExpr
          ? ctx.mapScalarExpression(itemExpr)
          : ctx.errorNode(item, "Missing sort expression"),
        direction: dirNode ? ctx.slice(dirNode) : undefined,
        nulls: nullsNode ? ctx.slice(nullsNode) : undefined,
        start: item.from,
        end: item.to,
      });
    }
  }

  return {
    type: "TopOperator",
    count: exprNode
      ? ctx.mapScalarExpression(exprNode)
      : ctx.errorNode(node, "Missing top count"),
    by: byExpressions,
    start: node.from,
    end: node.to,
  };
}

/**
 * Map distinct clause.
 */
function mapDistinctClause(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.TabularOperator | AST.ErrorNode {
  const columns = mapIdentifierList(node, ctx);
  return {
    type: "DistinctOperator",
    columns,
    start: node.from,
    end: node.to,
  };
}

/**
 * Map summarize clause.
 */
function mapSummarizeClause(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.TabularOperator | AST.ErrorNode {
  const aggregations: AST.Aggregation[] = [];
  const aggListNode = ctx.getChild(node, "AggregationList");
  if (aggListNode) {
    const items = ctx.getChildren(aggListNode, "AggregationItem");
    for (const item of items) {
      const identNode = ctx.getChild(item, "Identifier");
      const funcNode = ctx.getChild(item, "FunctionCall");
      aggregations.push({
        type: "Aggregation",
        alias: identNode ? ctx.slice(identNode) : undefined,
        function: funcNode
          ? mapFunctionCall(funcNode, ctx)
          : ctx.errorNode(item, "Missing aggregation function"),
        start: item.from,
        end: item.to,
      });
    }
  }

  const groupBy: AST.Expression[] = [];
  const groupByNode = ctx.getChild(node, "GroupByList");
  if (groupByNode) {
    const exprs = ctx.getChildren(groupByNode, "Expression");
    for (const expr of exprs) {
      groupBy.push(ctx.mapScalarExpression(expr));
    }
  }

  return {
    type: "SummarizeOperator",
    aggregations,
    by: groupBy,
    start: node.from,
    end: node.to,
  };
}

/**
 * Map mv-expand clause.
 */
function mapMvExpandClause(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.TabularOperator | AST.ErrorNode {
  const columns = mapIdentifierList(node, ctx);
  return {
    type: "MvExpandOperator",
    columns,
    start: node.from,
    end: node.to,
  };
}

/**
 * Map union clause (as tabular operator).
 */
function mapUnionClause(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.TabularOperator | AST.ErrorNode {
  const tableNode = ctx.getChild(node, "TableExpression");
  if (!tableNode) {
    return ctx.errorNode(node, "UnionClause missing table expression");
  }

  const table = mapTableExpression(tableNode, ctx);
  if (table.type === "ErrorNode") {
    return table;
  }

  return {
    type: "UnionOperator",
    tables: [table],
    start: node.from,
    end: node.to,
  };
}

/**
 * Map a FunctionCall node.
 */
function mapFunctionCall(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.FunctionCall | AST.ErrorNode {
  const identNode = ctx.getChild(node, "Identifier");
  if (!identNode) {
    return ctx.errorNode(node, "FunctionCall missing identifier");
  }

  const args: AST.Expression[] = [];
  const argListNode = ctx.getChild(node, "ArgumentList");
  if (argListNode) {
    const exprs = ctx.getChildren(argListNode, "Expression");
    for (const expr of exprs) {
      args.push(ctx.mapScalarExpression(expr));
    }
  }

  return {
    type: "FunctionCall",
    name: ctx.slice(identNode),
    arguments: args,
    start: node.from,
    end: node.to,
  };
}

/**
 * Helper: Map IdentifierList to string array.
 */
function mapIdentifierList(node: SyntaxNode, ctx: CstToAstContext): string[] {
  const columns: string[] = [];
  const listNode = ctx.getChild(node, "IdentifierList");
  if (listNode) {
    const identifiers = ctx.getChildren(listNode, "Identifier");
    for (const ident of identifiers) {
      columns.push(ctx.slice(ident));
    }
  }
  return columns;
}

/**
 * Export the context class for use in custom mappers.
 */
export { CstToAstContext };
