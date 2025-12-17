import { $ } from "bun";
import { writeFileSync, unlinkSync, existsSync } from "fs";
import { join } from "path";

const PROJECT_ROOT = join(import.meta.dir, "..");
const SRC_DIR = join(PROJECT_ROOT, "src");
const GRAMMAR_JS_PATH = join(PROJECT_ROOT, "grammar.js");
const GRAMMAR_JSON_PATH = join(SRC_DIR, "grammar.json");
const NODE_TYPES_PATH = join(SRC_DIR, "node-types.json");

let grammarArtifactsReady = false;

async function ensureGrammarArtifacts() {
  if (grammarArtifactsReady) return;

  if (!existsSync(GRAMMAR_JS_PATH)) {
    await $`bun run compile-grammar`;
  }

  if (!existsSync(GRAMMAR_JSON_PATH) || !existsSync(NODE_TYPES_PATH)) {
    await $`bun x tree-sitter generate --js-runtime bun`;
  }

  grammarArtifactsReady = true;
}

export async function parseWithTreeSitter(
  query: string
): Promise<{ success: boolean; output: string }> {
  await ensureGrammarArtifacts();
  const tempFile = ".test-query.kql";

  try {
    writeFileSync(tempFile, query);

    const result = await Promise.race([
      $`bun x tree-sitter parse ${tempFile}`.text(),
      new Promise<string>((_, reject) =>
        setTimeout(() => reject(new Error("Parse timeout")), 5000)
      ),
    ]);

    const hasError = result.includes("(ERROR");

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
