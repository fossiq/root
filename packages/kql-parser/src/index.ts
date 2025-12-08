import Parser from 'tree-sitter';
import { buildAST } from './builders/index.js';
import type { SourceFile } from './types.js';

export * from './types.js';
export { buildAST } from './builders/index.js';

export function createParser(language: any) {
  const parser = new Parser();
  parser.setLanguage(language);

  return {
    parse: (source: string): SourceFile => {
      const tree = parser.parse(source);
      return buildAST(tree.rootNode) as SourceFile;
    },
  };
}

export function parse(language: any, source: string): SourceFile {
  const parser = createParser(language);
  return parser.parse(source);
}
