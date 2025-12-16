import { $ } from "bun";

async function main() {
  console.log("Preparing upload directory...");
  
  try {
    // Create upload directory structure and copy files using bash commands
    await $`mkdir -p upload/packages`;
    await $`cp -r packages/*/dist upload/packages/ 2>/dev/null || true`;
    
    // Copy WASM file if it exists
    await $`if [ -f packages/kql-parser/tree-sitter-kql.wasm ]; then mkdir -p upload/packages/kql-parser && cp packages/kql-parser/tree-sitter-kql.wasm upload/packages/kql-parser/; fi`;
    
    console.log("✓ Upload directory prepared successfully");
  } catch (error) {
    console.error("Failed to prepare upload directory:", error);
    process.exit(1);
  }
}

main();