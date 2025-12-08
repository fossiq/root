import Parser from 'tree-sitter';
import { buildAST } from './builders/index.js';
import type { SourceFile } from './types.js';

export * from './types.js';
export { buildAST } from './builders/index.js';

/**
 * Tree-sitter language grammar object.
 *
 * This is an opaque type representing a compiled tree-sitter language module
 * (e.g., from packages like tree-sitter-javascript, tree-sitter-python, etc.).
 *
 * The actual structure is a native C++ module with bindings, so we use `unknown`
 * instead of `any` for type safety while maintaining flexibility.
 */
export type Language = unknown;

export function createParser(language: Language) {
  const parser = new Parser();
  parser.setLanguage(language as Parameters<typeof parser.setLanguage>[0]);

  return {
    parse: (source: string): SourceFile => {
      const tree = parser.parse(source);
      return buildAST(tree.rootNode) as SourceFile;
    },
  };
}

export function parse(language: Language, source: string): SourceFile {
  const parser = createParser(language);
  return parser.parse(source);
}
