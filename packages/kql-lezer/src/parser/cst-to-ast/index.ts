import { Tree, SyntaxNode } from "@lezer/common";
import { CstToAstContext } from "./context";
import { mapWhereOperator } from "./operators/where";
import { mapJoinOperator, mapLookupOperator } from "./operators/join";
import {
  mapRangeOperator,
  mapParseOperator,
  mapDatatableOperator,
  mapPrintOperator,
  mapMakeSeriesOperator,
} from "./operators/data";
import {
  mapSampleOperator,
  mapGetSchemaOperator,
  mapSerializeOperator,
  mapRenderOperator,
  mapPartitionOperator,
  mapEvaluateOperator,
  mapAsOperator,
} from "./operators/misc";
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
 */
function mapQuery(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.Query | AST.ErrorNode {
  const letStatements: AST.LetStatement[] = [];
  const letNodes = ctx.getChildren(node, "LetStatement");
  for (const letNode of letNodes) {
    const letStmt = mapLetStatement(letNode, ctx);
    if (letStmt.type === "ErrorNode") return letStmt;
    letStatements.push(letStmt as AST.LetStatement);
  }

  const setStatements: AST.SetStatement[] = [];
  const setNodes = ctx.getChildren(node, "SetStatement");
  for (const n of setNodes) {
    const nameNode = ctx.getChild(n, "Identifier");
    let value: AST.Literal | AST.Identifier | undefined;
    let child = n.firstChild;
    while (child) {
      if (["String", "Number", "Identifier"].includes(child.type.name)) {
        if (
          child !== nameNode &&
          child.type.name !== "set" &&
          child.type.name !== "Equals" &&
          child.type.name !== "Semicolon"
        ) {
          if (child.type.name === "Identifier") {
            value = {
              type: "Identifier",
              name: ctx.slice(child),
              start: child.from,
              end: child.to,
            };
          } else {
            const raw = ctx.slice(child);
            let val: any = raw;
            if (child.type.name === "Number") val = parseFloat(raw);
            else if (child.type.name === "String")
              val = ctx.parseStringLiteral(raw);
            value = {
              type: "Literal",
              value: val,
              raw,
              start: child.from,
              end: child.to,
            };
          }
          break;
        }
      }
      if (child.type.name === "true" || child.type.name === "false") {
        value = {
          type: "Literal",
          value: child.type.name === "true",
          raw: child.type.name,
          start: child.from,
          end: child.to,
        };
        break;
      }
      child = child.nextSibling;
    }

    setStatements.push({
      type: "SetStatement",
      name: nameNode ? ctx.slice(nameNode) : "",
      value: value as any,
      start: n.from,
      end: n.to,
    });
  }

  const declareParameters: AST.DeclareQueryParametersStatement[] = [];
  const declareNodes = ctx.getChildren(node, "DeclareQueryParametersStatement");
  for (const d of declareNodes) {
    const listNode = ctx.getChild(d, "QueryParameterList");
    const parameters: AST.QueryParameter[] = [];
    if (listNode) {
      const params = ctx.getChildren(listNode, "QueryParameter");
      for (const p of params) {
        const ids = ctx.getChildren(p, "Identifier");
        const expr = ctx.getChild(p, "Expression");
        if (ids.length >= 2) {
          parameters.push({
            type: "QueryParameter",
            name: ctx.slice(ids[0]),
            paramType: ctx.slice(ids[1]),
            defaultValue: expr ? ctx.mapScalarExpression(expr) : undefined,
            start: p.from,
            end: p.to,
          });
        }
      }
    }
    declareParameters.push({
      type: "DeclareQueryParametersStatement",
      parameters,
      start: d.from,
      end: d.to,
    });
  }

  const queryExprNode = ctx.getChild(node, "QueryExpression");
  if (!queryExprNode)
    return ctx.errorNode(node, "Query missing QueryExpression");

  const firstChild = queryExprNode.firstChild;
  if (!firstChild) return ctx.errorNode(queryExprNode, "Empty QueryExpression");

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

  if (expression.type === "ErrorNode") return expression as AST.ErrorNode;

  const query: AST.Query = {
    type: "Query",
    letStatements,
    setStatements,
    declareParameters,
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
 */
export function mapPipelineExpression(
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
 */
export function mapUnionExpression(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.UnionExpression | AST.ErrorNode {
  const tableList = ctx.getChild(node, "TableList");
  if (!tableList) {
    return ctx.errorNode(node, "UnionExpression missing table list");
  }

  const tables: (AST.TableSource | AST.PipelineExpression)[] = [];
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
 */
export function mapSearchExpression(
  node: SyntaxNode,
  _ctx: CstToAstContext
): AST.SearchExpression | AST.ErrorNode {
  return {
    type: "SearchExpression",
    start: node.from,
    end: node.to,
  };
}

/**
 * Map a FindExpression node.
 */
export function mapFindExpression(
  node: SyntaxNode,
  _ctx: CstToAstContext
): AST.FindExpression | AST.ErrorNode {
  return {
    type: "FindExpression",
    start: node.from,
    end: node.to,
  };
}

function mapTabularOperator(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.TabularOperator | AST.ErrorNode {
  const child = node.firstChild;
  if (!child) return ctx.errorNode(node, "Empty TabularOperator");

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

    case "JoinClause":
      return mapJoinOperator(child, ctx);
    case "LookupClause":
      return mapLookupOperator(child, ctx);
    case "ParseClause":
      return mapParseOperator(child, ctx);
    case "DatatableClause":
      return mapDatatableOperator(child, ctx);
    case "PrintClause":
      return mapPrintOperator(child, ctx);
    case "MakeSeriesClause":
      return mapMakeSeriesOperator(child, ctx);
    case "SerializeClause":
      return mapSerializeOperator(child, ctx);
    case "AsClause":
      return mapAsOperator(child, ctx);
    case "PartitionClause":
      return mapPartitionOperator(child, ctx);
    case "SampleClause":
      return mapSampleOperator(child, ctx);
    case "GetSchemaClause":
      return mapGetSchemaOperator(child, ctx);
    case "RenderClause":
      return mapRenderOperator(child, ctx);
    case "EvaluateClause":
      return mapEvaluateOperator(child, ctx);

    case "TableExpression":
      return mapTableExpression(child, ctx) as any;
    case "Number":
    case "String":
      return {
        type: "ProjectOperator", // Map to a dummy project for backward compatibility in tests
        columns: [
          {
            type: "ProjectColumn",
            expression: ctx.mapScalarExpression(child),
          },
        ],
        start: child.from,
        end: child.to,
      } as any;

    default:
      return ctx.errorNode(
        child,
        `Unsupported tabular operator: ${child.type.name}`
      );
  }
}

/**
 * Map a TableExpression node.
 */
export function mapTableExpression(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.TableSource | AST.PipelineExpression | AST.ErrorNode {
  const child = node.firstChild;
  if (!child) {
    return ctx.errorNode(node, "Empty TableExpression");
  }

  if (child.type.name === "RangeClause") {
    return mapRangeOperator(child, ctx);
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

function mapProjectExpressionItem(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.ProjectColumn {
  const identNode = ctx.getChild(node, "Identifier");
  const exprNode = ctx.getChild(node, "Expression");
  const equalsNode = ctx.getChild(node, "Equals");

  if (identNode && equalsNode && exprNode) {
    return {
      type: "ProjectColumn",
      alias: ctx.slice(identNode),
      expression: ctx.mapScalarExpression(exprNode),
      start: node.from,
      end: node.to,
    };
  } else if (exprNode) {
    return {
      type: "ProjectColumn",
      expression: ctx.mapScalarExpression(exprNode),
      start: node.from,
      end: node.to,
    };
  } else if (identNode) {
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

function mapUnionClause(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.TabularOperator | AST.ErrorNode {
  const tableListNode = ctx.getChild(node, "TableList");
  if (!tableListNode) {
    return ctx.errorNode(node, "UnionClause missing table list");
  }

  const tableNodes = ctx.getChildren(tableListNode, "TableExpression");
  const tables = tableNodes.map((t) => mapTableExpression(t, ctx));

  for (const t of tables) {
    if (t.type === "ErrorNode") return t;
  }

  let kind: string | undefined;
  let withSource: string | undefined;

  const paramsNode = ctx.getChild(node, "UnionParameters");
  if (paramsNode) {
    const kindToken = ctx.getChild(paramsNode, "kind");
    if (kindToken) {
      const kindVal = paramsNode.getChild("JoinKind");
      if (kindVal) kind = ctx.slice(kindVal);
    }
    const sourceToken = ctx.getChild(paramsNode, "withsource");
    if (sourceToken) {
      const idNode = paramsNode.getChild("Identifier");
      if (idNode) withSource = ctx.slice(idNode);
    }
  }

  return {
    type: "UnionOperator",
    tables: tables as (AST.TableSource | AST.PipelineExpression)[],
    kind,
    withSource,
    start: node.from,
    end: node.to,
  };
}

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
    args,
    start: node.from,
    end: node.to,
  };
}

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

export { CstToAstContext };
