import { buildAST } from './builders/index.js';
import type { SourceFile } from './types.js';

export * from './types.js';
export { buildAST } from './builders/index.js';

// Parser helpers removed to avoid hard dependency on native tree-sitter bindings.
// Consumers should use tree-sitter or web-tree-sitter directly and call buildAST.

