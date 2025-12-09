import { Parser, Language } from 'web-tree-sitter';
import { buildAST } from '@fossiq/kql-parser';
import type { SourceFile } from '@fossiq/kql-parser';

let parser: Parser | null = null;

export async function initParser(wasmPath: string): Promise<void> {
  if (parser) return;

  await Parser.init();
  const KqlLanguage = await Language.load(wasmPath);
  
  parser = new Parser();
  parser.setLanguage(KqlLanguage);
}

export function parseKql(query: string): SourceFile {
  if (!parser) {
    throw new Error('Parser not initialized. Call initParser() first.');
  }
  const tree = parser.parse(query);
  // @ts-ignore - web-tree-sitter types might differ slightly from native but AST structure is same
  return buildAST(tree.rootNode) as SourceFile;
}

