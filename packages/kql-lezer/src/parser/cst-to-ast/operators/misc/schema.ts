import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";
import { CstToAstContext } from "../../context";

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
