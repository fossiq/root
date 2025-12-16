import { $ } from "bun";
import { existsSync } from "fs";

async function main() {
  console.log("Merging build artifacts...");
  
  try {
    // Create packages directory
    await $`mkdir -p packages`;
    
    // Copy linux-x64 artifacts
    if (existsSync("temp-linux-x64/packages")) {
      await $`cp -r temp-linux-x64/packages/* packages/`;
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
  if (!existsSync(src)) {
    return;
  }
  
  // Get list of packages
  try {
    const result = await $`ls ${src}`.text();
    const packages = result.trim().split('\n').filter(Boolean);
    
    for (const pkg of packages) {
      const pkgPath = `${src}/${pkg}`;
      const targetPath = `packages/${pkg}`;
      
      // Check if package directory exists
      if (!existsSync(pkgPath)) {
        continue;
      }
      
      // Create target directory
      await $`mkdir -p ${targetPath}/dist`;
      
      // Copy dist directory if it exists
      const distPath = `${pkgPath}/dist`;
      if (existsSync(distPath)) {
        await $`cp -r ${distPath}/* ${targetPath}/dist/`;
      }
      
      // Copy WASM file if it exists
      const wasmPath = `${pkgPath}/tree-sitter-kql.wasm`;
      if (existsSync(wasmPath)) {
        await $`cp ${wasmPath} ${targetPath}/`;
      }
    }
  } catch (error) {
    // Ignore errors from ls command
  }
}

main();