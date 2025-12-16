import { $ } from "bun";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

async function directoryExists(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

async function copyDirectoryContents(src: string, dest: string): Promise<void> {
  await $`mkdir -p ${dest}`;
  await $`cp -r ${src}/. ${dest}/`;
}

async function main() {
  console.log("Preparing upload directory...");

  try {
    // Create upload directory structure
    await $`mkdir -p upload/packages`;

    // Get all package directories
    const packagesDir = "packages";
    const packageDirs = await readdir(packagesDir);
    
    // Copy each package's dist directory separately
    for (const pkg of packageDirs) {
      const distPath = join(packagesDir, pkg, "dist");
      const targetPath = join("upload", "packages", pkg);
      
      // Check if dist directory exists and copy its contents
      if (await directoryExists(distPath)) {
        await copyDirectoryContents(distPath, targetPath);
      }
    }

    // Copy WASM file if it exists
    const wasmPath = "packages/kql-parser/tree-sitter-kql.wasm";
    if (await Bun.file(wasmPath).exists()) {
      await $`mkdir -p upload/packages/kql-parser`;
      await $`cp ${wasmPath} upload/packages/kql-parser/`;
    }

    console.log("✓ Upload directory prepared successfully");
  } catch (error) {
    console.error("Failed to prepare upload directory:", error);
    process.exit(1);
  }
}

main();