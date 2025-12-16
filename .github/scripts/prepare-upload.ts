import { readdir, stat, mkdir, copyFile } from "node:fs/promises";
import { join, dirname } from "node:path";

async function directoryExists(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

async function copyDirectoryContents(src: string, dest: string): Promise<void> {
  // Create destination directory
  await mkdir(dest, { recursive: true });
  
  // Read source directory
  const entries = await readdir(src, { withFileTypes: true });
  
  // Copy each entry
  for (const entry of entries) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      await copyDirectoryContents(srcPath, destPath);
    } else {
      // Copy files
      await copyFile(srcPath, destPath);
    }
  }
}

async function copyFileIfExists(src: string, dest: string): Promise<void> {
  try {
    // Create destination directory
    await mkdir(dirname(dest), { recursive: true });
    
    // Copy file
    await copyFile(src, dest);
  } catch (error) {
    // File doesn't exist, ignore
    if (error.code !== 'ENOENT') {
      throw error;
    }
  }
}

async function main() {
  console.log("Preparing upload directory...");

  try {
    // Create upload directory structure
    await mkdir("upload/packages", { recursive: true });

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
    const targetWasmPath = "upload/packages/kql-parser/tree-sitter-kql.wasm";
    await copyFileIfExists(wasmPath, targetWasmPath);

    console.log("✓ Upload directory prepared successfully");
  } catch (error) {
    console.error("Failed to prepare upload directory:", error);
    process.exit(1);
  }
}

main();