import { SyntaxNode } from "@lezer/common";
import type * as AST from "@fossiq/kql-ast";
import { CstToAstContext } from "../context";

export function mapSetStatements(
  node: SyntaxNode,
  ctx: CstToAstContext
): AST.SetStatement[] {
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
            let val: AST.Literal["value"] = raw;
            if (child.type.name === "Number") val = parseFloat(raw);
            else if (child.type.name === "String") {
              val = ctx.parseStringLiteral(raw);
            }
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
      value: value as AST.SetStatement["value"],
      start: n.from,
      end: n.to,
    });
  }

  return setStatements;
}
