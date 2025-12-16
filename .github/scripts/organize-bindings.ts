import { $ } from "bun";
import { join } from "path";
import { existsSync } from "fs";

async function main() {
  console.log("Organizing binding artifacts...");
  
  try {
    const prebuildsDir = join(process.cwd(), "packages", "kql-parser", "prebuilds");
    
    // Check if prebuilds directory exists
    if (!existsSync(prebuildsDir)) {
      console.log("Prebuilds directory not found, skipping");
      return;
    }
    
    // Change to prebuilds directory
    process.chdir(prebuildsDir);
    
    // Get list of binding directories
    try {
      const result = await $`ls -d binding-* 2>/dev/null || echo ""`.text();
      const bindingDirs = result.trim().split('\n').filter(Boolean);
      
      // Process each binding directory
      for (const dir of bindingDirs) {
        // Skip if not a directory
        if (!existsSync(dir)) {
          continue;
        }
        
        // Get target name
        const target = dir.replace("binding-", "");
        
        // Create target directory
        await $`mkdir -p ${target}`;
        
        // Move contents if directory exists
        if (existsSync(dir)) {
          await $`mv ${dir}/* ${target}/ 2>/dev/null || true`;
        }
        
        // Remove empty directory if it still exists
        if (existsSync(dir)) {
          await $`rmdir ${dir}`;
        }
      }
    } catch (error) {
      // Ignore errors from ls command
    }
    
    console.log("✓ Binding artifacts organized:");
    await $`ls -R`;
  } catch (error) {
    console.error("Failed to organize binding artifacts:", error);
    process.exit(1);
  }
}

main();