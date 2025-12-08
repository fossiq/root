import type { SyntaxNode } from 'tree-sitter';
import type {
  Identifier,
  StringLiteral,
  NumberLiteral,
  BooleanLiteral,
  NullLiteral,
} from '../types.js';

export function buildIdentifier(node: SyntaxNode): Identifier {
  return {
    type: 'identifier',
    name: node.text,
  };
}

export function buildStringLiteral(node: SyntaxNode): StringLiteral {
  const text = node.text;
  const value = text.slice(1, -1);
  return {
    type: 'string_literal',
    value,
  };
}

export function buildNumberLiteral(node: SyntaxNode): NumberLiteral {
  return {
    type: 'number_literal',
    value: parseFloat(node.text),
  };
}

export function buildBooleanLiteral(node: SyntaxNode): BooleanLiteral {
  return {
    type: 'boolean_literal',
    value: node.text === 'true',
  };
}

export function buildNullLiteral(node: SyntaxNode): NullLiteral {
  return {
    type: 'null_literal',
    value: null,
  };
}
