import { readdir, stat, mkdir, copyFile, access } from "node:fs/promises";
import { join, dirname } from "node:path";

async function directoryExists(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
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

async function main() {
  console.log("Merging build artifacts...");
  
  try {
    // Create packages directory
    await mkdir("packages", { recursive: true });
    
    // Copy linux-x64 artifacts
    const linuxSrc = "temp-linux-x64/packages";
    if (await directoryExists(linuxSrc)) {
      const packages = await readdir(linuxSrc);
      for (const pkg of packages) {
        const srcPath = join(linuxSrc, pkg);
        const destPath = join("packages", pkg);
        if (await directoryExists(srcPath)) {
          await copyDirectoryContents(srcPath, destPath);
        }
      }
    }
    
    // Process other platforms
    const platforms = ["darwin-arm64", "darwin-x64", "win32-x64"];
    
    for (const platform of platforms) {
      await processPlatformArtifacts(platform);
    }
    
    console.log("✓ Build artifacts merged successfully");
  } catch (error) {
    console.error("Failed to merge build artifacts:", error);
    process.exit(1);
  }
}

async function processPlatformArtifacts(platform: string) {
  const src = `temp-${platform}/packages`;
  
  // Check if source directory exists
  if (!await directoryExists(src)) {
    return;
  }
  
  // Get list of packages
  try {
    const packages = await readdir(src);
    
    for (const pkg of packages) {
      const pkgPath = join(src, pkg);
      const targetPath = join("packages", pkg);
      
      // Check if package directory exists
      if (!await directoryExists(pkgPath)) {
        continue;
      }
      
      // Create target directory
      await mkdir(join(targetPath, "dist"), { recursive: true });
      
      // Copy dist directory if it exists
      const distPath = join(pkgPath, "dist");
      if (await directoryExists(distPath)) {
        await copyDirectoryContents(distPath, join(targetPath, "dist"));
      }
      
      // Copy WASM file if it exists
      const wasmPath = join(pkgPath, "tree-sitter-kql.wasm");
      const targetWasmPath = join(targetPath, "tree-sitter-kql.wasm");
      if (await fileExists(wasmPath)) {
        await mkdir(dirname(targetWasmPath), { recursive: true });
        await copyFile(wasmPath, targetWasmPath);
      }
    }
  } catch (error) {
    // Ignore errors
  }
}

main();