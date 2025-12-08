import { createParser } from '@fossiq/kql-parser';
// @ts-ignore
import KqlLanguage from '@fossiq/kql-parser/bindings/node/index.js';
import type { SourceFile } from '@fossiq/kql-parser';

export function parseKql(query: string): SourceFile {
  const language = (KqlLanguage as any).language || KqlLanguage;
  const { parse } = createParser(language);
  return parse(query);
}
