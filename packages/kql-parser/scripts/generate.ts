#!/usr/bin/env bun
import { readFileSync, writeFileSync } from 'fs';
import { $ } from 'bun';
import { dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Change to the parent directory of the script
process.chdir(`${__dirname}/..`);

try {
  // Compile the grammar
  await $`bun run compile-grammar`;

  // Temporarily remove "type": "module" for tree-sitter-cli compatibility
  console.log('Temporarily adjusting package.json for tree-sitter compatibility...');
  const pkgPath = 'package.json';
  let pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  delete pkg.type;
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  // Run tree-sitter generate
  console.log('Generating parser...');
  await $`bun x tree-sitter-cli generate`;

  // Restore "type": "module"
  console.log('Restoring package.json...');
  pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));
  pkg.type = 'module';
  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

  console.log('✓ Parser generation complete');
} catch (error) {
  console.error('Error during parser generation:', error);
  process.exit(1);
}
