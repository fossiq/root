import { SyntaxNode } from "@lezer/common";
import { CstToAstContext } from "../context";
import type * as AST from "@fossiq/kql-ast";
import { mapPipelineExpression } from "../index";

export function mapSampleOperator(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.SampleOperator | AST.ErrorNode {
  // SampleClause: kw("sample") optional(Identifier) Expression
  const exprNode = ctx.getChild(node, "Expression");
  if (!exprNode) return ctx.errorNode(node, "Sample missing count expression");

  const kindNode = ctx.getChild(node, "Identifier"); // distinct?

  return {
    type: "SampleOperator",
    count: ctx.mapScalarExpression(exprNode),
    kind: kindNode ? ctx.slice(kindNode) : undefined,
    start: node.from,
    end: node.to,
  };
}

export function mapGetSchemaOperator(
  node: SyntaxNode,
  _ctx: CstToAstContext
): AST.GetSchemaOperator {
  return {
    type: "GetSchemaOperator",
    start: node.from,
    end: node.to,
  };
}

export function mapSerializeOperator(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.SerializeOperator {
  // SerializeClause: serialize IdentifierList?
  const columns: string[] = [];
  const listNode = ctx.getChild(node, "IdentifierList");
  if (listNode) {
    const identifiers = ctx.getChildren(listNode, "Identifier");
    for (const id of identifiers) columns.push(ctx.slice(id));
  }
  return {
    type: "SerializeOperator",
    columns,
    start: node.from,
    end: node.to,
  };
}

export function mapAsOperator(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.AsOperator | AST.ErrorNode {
  const identifiers = ctx.getChildren(node, "Identifier");
  const nameNode = identifiers[identifiers.length - 1];

  if (!nameNode) return ctx.errorNode(node, "As missing alias");

  let materialized: boolean | undefined;
  const hintNode = ctx.getChild(node, "AsHint");
  if (hintNode) {
    if (ctx.getChild(hintNode, "true")) materialized = true;
    if (ctx.getChild(hintNode, "false")) materialized = false;
  }

  return {
    type: "AsOperator",
    name: ctx.slice(nameNode),
    materialized,
    start: node.from,
    end: node.to,
  };
}

export function mapRenderOperator(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.RenderOperator | AST.ErrorNode {
  // RenderClause: render Identifier (with (Props))?
  const typeNode = ctx.getChild(node, "Identifier");
  if (!typeNode) return ctx.errorNode(node, "Render missing chart type");

  const options: Record<string, string> = {};
  const propsNode = ctx.getChild(node, "RenderProperties");
  if (propsNode) {
    // RenderProperties -> ProjectExpressionList -> Item -> Identifier = Expression
    // Actually RenderProperties uses ProjectExpressionList.
    // I need to map it.
    // For simplicity, I'll iterate children "ProjectExpressionItem"
    // But context doesn't expose `mapProjectExpressionList` logic directly unless I duplicated it or access generic children.
    // Let's assume generic access.
    const items = ctx.getChildren(propsNode, "ProjectExpressionItem");
    for (const item of items) {
      // item -> Identifier = Expression
      const id = ctx.getChild(item, "Identifier");
      const expr = ctx.getChild(item, "Expression");
      if (id && expr) {
        options[ctx.slice(id)] = ctx.slice(expr); // Using raw text for value for now
      }
    }
  }

  return {
    type: "RenderOperator",
    chartType: ctx.slice(typeNode),
    options,
    start: node.from,
    end: node.to,
  };
}

export function mapPartitionOperator(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.PartitionOperator | AST.ErrorNode {
  // PartitionClause: partition by Identifier ( PipelineExpression )
  const idNode = ctx.getChild(node, "Identifier");
  const pipeNode = ctx.getChild(node, "PipelineExpression");

  if (!idNode || !pipeNode)
    return ctx.errorNode(node, "Partition missing column or sub-query");

  const subQuery = mapPipelineExpression(pipeNode, ctx);
  if (subQuery.type === "ErrorNode") return subQuery;

  return {
    type: "PartitionOperator",
    by: ctx.slice(idNode),
    pipeline: subQuery,
    start: node.from,
    end: node.to,
  };
}

export function mapEvaluateOperator(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.EvaluateOperator | AST.ErrorNode {
  // EvaluateClause: evaluate FunctionCall
  const funcNode = ctx.getChild(node, "FunctionCall");
  if (!funcNode) return ctx.errorNode(node, "Evaluate missing plugin call");

  const call = ctx.mapFunctionCall(funcNode);
  if (call.type === "ErrorNode") return call;

  return {
    type: "EvaluateOperator",
    plugin: call,
    start: node.from,
    end: node.to,
  };
}
