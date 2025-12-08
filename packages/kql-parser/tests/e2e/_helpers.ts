import { $ } from 'bun';
import { writeFileSync, unlinkSync } from 'fs';

export async function parseWithTreeSitter(query: string): Promise<{ success: boolean; output: string }> {
  const tempFile = '.test-query.kql';

  try {
    writeFileSync(tempFile, query);

    const result = await Promise.race([
      $`bun x tree-sitter-cli parse ${tempFile}`.text(),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error('Parse timeout')), 5000)
      ),
    ]);

    const hasError = result.includes('(ERROR');

    return {
      success: !hasError,
      output: result,
    };
  } finally {
    try {
      unlinkSync(tempFile);
    } catch {
      // Ignore cleanup errors
    }
  }
}
