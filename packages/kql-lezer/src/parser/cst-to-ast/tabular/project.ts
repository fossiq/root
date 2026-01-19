import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";
import { CstToAstContext } from "../context";
import { mapIdentifierList } from "./identifiers";

export function mapProjectClause(
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

export function mapProjectVariant(
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

export function mapProjectRenameClause(
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

export function mapExtendClause(
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

function mapProjectExpressionList(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.ProjectColumn[] {
  const columns: AST.ProjectColumn[] = [];
  const listNode = ctx.getChild(node, "ProjectExpressionList");
  if (!listNode) return columns;

  const items = ctx.getChildren(listNode, "ProjectExpressionItem");
  for (const item of items) {
    columns.push(mapProjectExpressionItem(item, ctx));
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
  }
  if (exprNode) {
    return {
      type: "ProjectColumn",
      expression: ctx.mapScalarExpression(exprNode),
      start: node.from,
      end: node.to,
    };
  }
  if (identNode) {
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
