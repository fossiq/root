import { $ } from "bun";
import { join } from "path";

async function main() {
  const kqlParserPath = join(process.cwd(), "packages", "kql-parser");
  process.chdir(kqlParserPath);
  
  console.log("Building WASM artifacts...");
  try {
    await $`bun run build:wasm`;
    console.log("✓ WASM artifacts built successfully");
  } catch (error) {
    console.error("Failed to build WASM artifacts:", error);
    process.exit(1);
  }
}

main();