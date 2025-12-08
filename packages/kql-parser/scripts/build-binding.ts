import { $ } from 'bun';
import { mkdir, copyFile } from 'fs/promises';
import { join } from 'path';
import os from 'os';

const platform = os.platform();
const arch = os.arch();

const supportedTargets = [
  'linux-x64',
  'linux-arm64',
  'win32-x64',
  'darwin-arm64'
];

const currentTarget = `${platform}-${arch}`;

if (!supportedTargets.includes(currentTarget)) {
  console.warn(`⚠️  Warning: Current target ${currentTarget} is not in the supported list: ${supportedTargets.join(', ')}`);
  console.warn('   Building anyway, but this artifact may not be distributed.');
}

console.log(`Building bindings for ${currentTarget}...`);

try {
  // Rebuild using node-gyp
  // On Windows, we might need to ensure the build tools are present, but node-gyp usually handles it.
  await $`bunx node-gyp rebuild`;

  // Create prebuilds directory
  const targetDir = join(import.meta.dir, '../prebuilds', currentTarget);
  await mkdir(targetDir, { recursive: true });

  // Copy the built binary
  const src = join(import.meta.dir, '../build/Release/tree_sitter_kql_binding.node');
  const dest = join(targetDir, 'tree-sitter-kql.node');

  await copyFile(src, dest);
  console.log(`✓ Binding copied to ${dest}`);
} catch (error) {
  console.error('Failed to build bindings:', error);
  process.exit(1);
}
