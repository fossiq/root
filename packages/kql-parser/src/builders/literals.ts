import type { SyntaxNode } from "tree-sitter";
import type {
  Identifier,
  QualifiedIdentifier,
  StringLiteral,
  NumberLiteral,
  BooleanLiteral,
  NullLiteral,
  DynamicLiteral,
  DatetimeLiteral,
  TimespanLiteral,
} from "../types.js";

export function buildIdentifier(node: SyntaxNode): Identifier {
  return {
    type: "identifier",
    name: node.text,
  };
}

export function buildQualifiedIdentifier(
  node: SyntaxNode
): QualifiedIdentifier {
  const table = node.child(0);
  const column = node.child(2); // Skip '.'

  if (!table || !column) {
    throw new Error("Qualified identifier missing table or column");
  }

  return {
    type: "qualified_identifier",
    table: buildIdentifier(table),
    column: buildIdentifier(column),
  };
}

export function buildStringLiteral(node: SyntaxNode): StringLiteral {
  const text = node.text;
  const value = text.slice(1, -1);
  return {
    type: "string_literal",
    value,
  };
}

export function buildNumberLiteral(node: SyntaxNode): NumberLiteral {
  return {
    type: "number_literal",
    value: parseFloat(node.text),
  };
}

export function buildBooleanLiteral(node: SyntaxNode): BooleanLiteral {
  return {
    type: "boolean_literal",
    value: node.text === "true",
  };
}

export function buildNullLiteral(_node: SyntaxNode): NullLiteral {
  return {
    type: "null_literal",
    value: null,
  };
}

export function buildDynamicLiteral(node: SyntaxNode): DynamicLiteral {
  // Extract the content inside dynamic(...)
  // Skip 'dynamic', '(', and ')'
  let content = "";
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (
      child &&
      child.type !== "dynamic" &&
      child.text !== "(" &&
      child.text !== ")"
    ) {
      content = child.text;
      break;
    }
  }

  return {
    type: "dynamic_literal",
    value: content,
  };
}

export function buildDatetimeLiteral(node: SyntaxNode): DatetimeLiteral {
  // Extract datetime value from datetime(...) function call
  // Format: datetime(YYYY-MM-DD HH:MM:SS.fff) or similar ISO 8601 variants
  let value = "";
  for (let i = 0; i < node.childCount; i++) {
    const child = node.child(i);
    if (
      child &&
      child.type !== "datetime" &&
      child.text !== "(" &&
      child.text !== ")"
    ) {
      value = child.text;
      break;
    }
  }

  return {
    type: "datetime_literal",
    value,
  };
}

export function buildTimespanLiteral(node: SyntaxNode): TimespanLiteral {
  // Extract timespan value in format like 1d, 2h, 30m, 500ms
  const value = node.text;

  return {
    type: "timespan_literal",
    value,
  };
}
