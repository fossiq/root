#!/usr/bin/env node
import { readFileSync, writeFileSync } from "fs";
import { generateGrammar } from "./generator.js";

function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.error("Usage: lezer-grammar-generator <config-file> <output-file>");
    console.error("");
    console.error("Arguments:");
    console.error("  <config-file>  JSON file containing grammar configuration");
    console.error("  <output-file>  File to write generated grammar to");
    process.exit(1);
  }
  
  const [configFile, outputFile] = args;
  
  try {
    const configContent = readFileSync(configFile, "utf8");
    const config = JSON.parse(configContent);
    
    const result = generateGrammar(config);
    
    if (result.errors.length > 0) {
      console.error("Failed to generate grammar:");
      result.errors.forEach(error => console.error(`  - ${error}`));
      process.exit(1);
    }
    
    writeFileSync(outputFile, result.grammar, "utf8");
    console.log(`Grammar written to ${outputFile}`);
    
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}