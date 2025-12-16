import { $ } from "bun";
import { join } from "path";

async function main() {
  console.log("=== Detecting packages to publish ===");
  
  try {
    // Get list of ALL publishable packages (excluding ui which is private)
    let packagesToPublish: string[] = [];
    
    try {
      const result = await $`bun x turbo run ci:publish --dry-run=json`.text();
      const packagesJson = JSON.parse(result);
      packagesToPublish = packagesJson.packages
        .filter((pkg: string) => !pkg.startsWith("//") && pkg !== "fossiq-monorepo" && pkg !== "ui");
    } catch (error) {
      console.log("No packages found to publish");
      console.log("published=0");
      return;
    }
    
    if (packagesToPublish.length === 0) {
      console.log("No packages found to publish");
      console.log("published=0");
      return;
    }
    
    console.log("Packages to publish:");
    console.log(packagesToPublish.join("\n"));
    console.log("");
    
    let published = 0;
    
    for (const pkg of packagesToPublish) {
      // Extract package name (e.g., @fossiq/kql-parser -> kql-parser)
      const pkgName = pkg.replace("@fossiq/", "");
      
      console.log(`=== Publishing @fossiq/${pkgName} ===`);
      const pkgDir = join(process.cwd(), "packages", pkgName);
      process.chdir(pkgDir);
      
      try {
        const result = await $`bun publish --ignore-scripts`.text();
        console.log(result);
        console.log(`✓ @fossiq/${pkgName} published successfully`);
        published = 1;
      } catch (error: any) {
        if (error?.message?.includes("409 Conflict")) {
          console.log(`⚠ @fossiq/${pkgName} already published (409 Conflict) - skipping`);
        } else {
          console.log(`✗ @fossiq/${pkgName} publish failed`);
          throw error;
        }
      }
    }
    
    console.log("");
    console.log("=== Publish Summary ===");
    if (published === 1) {
      console.log("At least one package was published");
    } else {
      console.log("No packages were published (all already at current version)");
    }
    
    console.log(`published=${published}`);
  } catch (error) {
    console.error("Failed to publish packages:", error);
    process.exit(1);
  }
}

main();