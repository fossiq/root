#!/usr/bin/env bun
import { existsSync, readFileSync, writeFileSync } from "fs";
import { $ } from "bun";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

process.chdir(join(__dirname, ".."));

const pkgPath = join(process.cwd(), "package.json");
const originalPackageJson = readFileSync(pkgPath, "utf8");
const treeSitterBinary = resolveTreeSitterBinary();

function log(message: string) {
  console.log(`[generate] ${message}`);
}

function resolveTreeSitterBinary(): string | null {
  const override = process.env.TREE_SITTER_CLI?.trim();
  if (override) {
    return override;
  }

  const binName =
    process.platform === "win32" ? "tree-sitter.cmd" : "tree-sitter";
  const candidate = join(process.cwd(), "node_modules", ".bin", binName);

  return existsSync(candidate) ? candidate : null;
}

function writePackageJson(contents: Record<string, unknown>) {
  writeFileSync(pkgPath, `${JSON.stringify(contents, null, 2)}\n`);
}

function restorePackageJson() {
  writeFileSync(pkgPath, originalPackageJson);
}

function stripModuleType(): boolean {
  const pkg = JSON.parse(originalPackageJson);
  if (pkg.type === undefined) {
    return false;
  }

  delete pkg.type;
  writePackageJson(pkg);
  return true;
}

async function runTreeSitterGenerate() {
  if (treeSitterBinary) {
    log(`Using tree-sitter binary: ${treeSitterBinary}`);
    await $`${treeSitterBinary} generate`;
    return;
  }

  log("Using tree-sitter via bun x");
  await $`bun x tree-sitter generate`;
}

async function main() {
  try {
    log("Compiling grammar sources");
    await $`bun run compile-grammar`;

    const modifiedPackage = stripModuleType();
    if (modifiedPackage) {
      log('Temporarily removed "type": "module" for tree-sitter compatibility');
    }

    log("Generating parser");
    await runTreeSitterGenerate();

    log("✓ Parser generation complete");
  } catch (error) {
    console.error("[generate] Error during parser generation:", error);
    process.exitCode = 1;
  } finally {
    restorePackageJson();
  }
}

await main();
