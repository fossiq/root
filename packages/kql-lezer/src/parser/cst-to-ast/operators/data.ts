import { SyntaxNode } from "@lezer/common";
import { CstToAstContext } from "../context";
import type * as AST from "@fossiq/kql-ast";

export function mapRangeOperator(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.RangeOperator | AST.ErrorNode {
  const nameNode = ctx.getChild(node, "Identifier");
  const exprNodes = ctx.getChildren(node, "Expression");

  if (!nameNode || exprNodes.length < 3) {
    return ctx.errorNode(node, "Range missing name or bounds");
  }

  const [fromNode, toNode, stepNode] = exprNodes;

  return {
    type: "RangeOperator",
    name: ctx.slice(nameNode),
    from: ctx.mapScalarExpression(fromNode),
    to: ctx.mapScalarExpression(toNode),
    step: ctx.mapScalarExpression(stepNode),
    start: node.from,
    end: node.to,
  };
}

export function mapParseOperator(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.ParseOperator | AST.ErrorNode {
  const exprNode = ctx.getChild(node, "Expression");
  const patternNode = ctx.getChild(node, "String");
  const kindNode = ctx.getChild(node, "ParseKind"); // Need to extract value from ParseKind -> "simple"|"regex"

  if (!exprNode || !patternNode)
    return ctx.errorNode(node, "Parse missing expression or pattern");

  let kind: "simple" | "regex" | "relaxed" | undefined;
  if (kindNode) {
    const k = ctx.slice(kindNode);
    // k might be "kind = simple". Need to extract the value.
    if (k.includes("simple")) kind = "simple";
    else if (k.includes("regex")) kind = "regex";
    else if (k.includes("relaxed")) kind = "relaxed";
  }

  // Expression is usually just a column identifier for `parse Col ...` but grammar allows Expression.
  // AST expects `column: string`.
  // If expression is Identifier, use name. If not, fallback or error?
  // AST definition: column: string.
  // I should check if exprNode is Identifier.

  const expression = ctx.mapScalarExpression(exprNode);
  let column = "";
  if (expression.type === "Identifier") {
    column = expression.name;
  } else {
    // For now, if it's not a simple identifier, we might have issues matching AST type.
    // But implementation guide says `parse Message ...`.
    column = ctx.slice(exprNode); // Fallback
  }

  return {
    type: "ParseOperator",
    column,
    kind,
    pattern: ctx.parseStringLiteral(ctx.slice(patternNode)),
    start: node.from,
    end: node.to,
  };
}

export function mapDatatableOperator(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.DatatableOperator | AST.ErrorNode {
  const schemaNode = ctx.getChild(node, "DatatableSchema");
  const dataNode = ctx.getChild(node, "DatatableData");

  const schema: { name: string; type: string }[] = [];
  if (schemaNode) {
    const cols = ctx.getChildren(schemaNode, "DatatableColumnDef");
    for (const col of cols) {
      const parts = ctx.getChildren(col, "Identifier");
      if (parts.length >= 2) {
        schema.push({ name: ctx.slice(parts[0]), type: ctx.slice(parts[1]) });
      }
    }
  }

  const data: AST.Literal[][] = []; // This is tricky. DatatableData is a flat list of literals.
  // We need to chunk it by schema length.
  if (dataNode && schema.length > 0) {
    const literals = ctx.getChildren(dataNode, "LiteralValue");
    let currentRow: AST.Literal[] = [];
    for (const lit of literals) {
      // Map LiteralValue to AST Literal
      // LiteralValue children: Number, String, true, false, null
      const valNode = lit.firstChild;
      let val: AST.Literal;
      if (valNode) {
        if (valNode.type.name === "Number") {
          const raw = ctx.slice(valNode);
          val = {
            type: "Literal",
            value: parseFloat(raw),
            raw,
            start: valNode.from,
            end: valNode.to,
          };
        } else if (valNode.type.name === "String") {
          const raw = ctx.slice(valNode);
          val = {
            type: "Literal",
            value: ctx.parseStringLiteral(raw),
            raw,
            start: valNode.from,
            end: valNode.to,
          };
        } else {
          // Boolean or null keywords
          const raw = ctx.slice(valNode);
          val = {
            type: "Literal",
            value: raw === "null" ? null : raw === "true",
            raw,
            start: valNode.from,
            end: valNode.to,
          };
        }
        currentRow.push(val);
      }
      if (currentRow.length === schema.length) {
        data.push(currentRow);
        currentRow = [];
      }
    }
  }

  return {
    type: "DatatableOperator",
    schema,
    data,
    start: node.from,
    end: node.to,
  };
}

export function mapPrintOperator(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.PrintOperator | AST.ErrorNode {
  const listNode = ctx.getChild(node, "ProjectItemList");
  if (listNode) {
    // ProjectItemList -> Identifier (Comma Identifier)*
    // WAIT! ProjectItemList in `project-operators.ts` was `separatedList(ref("Identifier"), ...)`?
    // Let's check `project-operators.ts` again.
    // In `project-operators.ts`:
    // ProjectItemList: expression: separatedList(ref("Identifier"), ref("Comma"), { min: 1 })
    // BUT `mapProjectExpressionList` in `index.ts` uses `ProjectExpressionItem`.
    // There is a mismatch or I misread the grammar.
    // `src/grammar/plugins/rules/project-operators.ts`:
    // `ProjectItemList` is defined as list of `Identifier`.
    // But `mapProjectExpressionList` maps `ProjectExpressionItem`.
    // I need to check `project-operators.ts` content again.
  }

  // If ProjectItemList is just Identifiers, `print` supports expressions `print x=1`.
  // So `ProjectItemList` MUST support expressions.
  // I suspect `project-operators.ts` I wrote earlier or what was there is simple identifiers only?
  // `ProjectClause` uses `ProjectItemList`.

  return {
    type: "PrintOperator",
    expressions: [], // Placeholder until I fix grammar check
    start: node.from,
    end: node.to,
  };
}

export function mapMakeSeriesOperator(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.MakeSeriesOperator | AST.ErrorNode {
  // MakeSeriesClause: make-series AggregationList on Expression step Expression by GroupByList
  const aggList = ctx.getChild(node, "AggregationList");
  const aggregations: AST.Aggregation[] = [];
  if (aggList) {
    const items = ctx.getChildren(aggList, "AggregationItem");
    for (const item of items) {
      // ... similar to summarize ...
      const identNode = ctx.getChild(item, "Identifier");
      const funcNode = ctx.getChild(item, "FunctionCall");
      if (funcNode) {
        aggregations.push({
          type: "Aggregation",
          alias: identNode ? ctx.slice(identNode) : undefined,
          function: ctx.mapFunctionCall(funcNode) as any, // Need to cast or fix helper types
          start: item.from,
          end: item.to,
        });
      }
    }
  }

  // on Expression step Expression
  // Need to find children and distinguish which is "on" and which is "step".
  // Lezer tree gives children in order.
  // make-series ... on [Expr] step [Expr] ...

  // This is getting complicated to extract positional args without named nodes.
  // I should probably have named rules for OnClause, StepClause in grammar.
  // But for now, I can iterate children.

  // ... skipping implementation details for brevity, will fix in full file write ...

  return {
    type: "MakeSeriesOperator",
    aggregations,
    on: {} as any,
    step: {} as any,
    start: node.from,
    end: node.to,
  };
}
