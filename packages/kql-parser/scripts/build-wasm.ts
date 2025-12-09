import { $ } from 'bun';
import { existsSync } from 'fs';
import { join } from 'path';

const wasmPath = join(import.meta.dir, '../tree-sitter-kql.wasm');

/**
 * Build WASM binary
 *
 * Note: This script requires tree-sitter CLI and Emscripten/Docker.
 * In development, the WASM file should be pre-built and committed to the repo.
 * This script is primarily for CI/CD environments.
 */

if (existsSync(wasmPath)) {
  console.log(`✓ WASM binary already exists at ${wasmPath}`);
  console.log('  Skipping build. To rebuild, delete the .wasm file and run again.');
  process.exit(0);
}

console.log('Building WASM binary...');
console.log('⚠️  Note: This requires tree-sitter CLI and Emscripten.');
console.log('   If you see errors, install Emscripten or use a prebuilt WASM from CI.');

try {
  await $`bunx tree-sitter build --wasm`;
  console.log(`✓ WASM binary built successfully`);
} catch (error) {
  console.error('Failed to build WASM binary:', error);
  console.error('\n📝 Solution:');
  console.error('  1. WASM is typically built in CI and committed to the repo');
  console.error('  2. If you need to rebuild locally, install Emscripten:');
  console.error('     https://emscripten.org/docs/getting_started/downloads.html');
  console.error('  3. Or, copy a prebuilt tree-sitter-kql.wasm from a recent release');
  process.exit(1);
}
