import { readdir, stat, mkdir, rename, rmdir } from "node:fs/promises";
import { join } from "node:path";

async function directoryExists(path: string): Promise<boolean> {
  try {
    const stats = await stat(path);
    return stats.isDirectory();
  } catch {
    return false;
  }
}

async function moveDirectoryContents(src: string, dest: string): Promise<void> {
  // Create destination directory
  await mkdir(dest, { recursive: true });
  
  // Read source directory
  const entries = await readdir(src);
  
  // Move each entry
  for (const entry of entries) {
    const srcPath = join(src, entry);
    const destPath = join(dest, entry);
    
    // Move entry
    await rename(srcPath, destPath);
  }
  
  // Remove empty source directory
  try {
    await rmdir(src);
  } catch {
    // Ignore errors if directory is not empty
  }
}

async function main() {
  console.log("Organizing binding artifacts...");
  
  try {
    const prebuildsDir = join(process.cwd(), "packages", "kql-parser", "prebuilds");
    
    // Check if prebuilds directory exists
    if (!await directoryExists(prebuildsDir)) {
      console.log("Prebuilds directory not found, skipping");
      return;
    }
    
    // Change to prebuilds directory
    process.chdir(prebuildsDir);
    
    // Get list of binding directories
    try {
      const entries = await readdir(".");
      const bindingDirs = entries.filter(entry => 
        entry.startsWith("binding-") && entry !== "binding-" && entry.length > 8
      );
      
      // Process each binding directory
      for (const dir of bindingDirs) {
        // Skip if not a directory
        if (!await directoryExists(dir)) {
          continue;
        }
        
        // Get target name
        const target = dir.replace("binding-", "");
        
        // Create target directory
        await mkdir(target, { recursive: true });
        
        // Move contents if directory exists
        if (await directoryExists(dir)) {
          await moveDirectoryContents(dir, target);
        }
      }
    } catch (error) {
      // Ignore errors
    }
    
    console.log("✓ Binding artifacts organized:");
    
    // List all directories
    try {
      const entries = await readdir(".");
      for (const entry of entries) {
        if (await directoryExists(entry)) {
          console.log(entry + "/");
        } else {
          console.log(entry);
        }
      }
    } catch (error) {
      // Ignore errors
    }
  } catch (error) {
    console.error("Failed to organize binding artifacts:", error);
    process.exit(1);
  }
}

main();