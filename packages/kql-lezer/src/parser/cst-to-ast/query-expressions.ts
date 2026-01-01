import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";
import { CstToAstContext } from "./context";
import { mapRangeOperator } from "./operators/data/range";
import { mapTabularOperator } from "./tabular/operator";

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
