import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";
import { CstToAstContext } from "../../context";

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

  const data: AST.Literal[][] = [];
  if (dataNode && schema.length > 0) {
    const literals = ctx.getChildren(dataNode, "LiteralValue");
    let currentRow: AST.Literal[] = [];
    for (const lit of literals) {
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
