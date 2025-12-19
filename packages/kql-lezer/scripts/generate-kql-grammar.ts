import {
    generateLezerGrammar,
    validateGrammar,
} from "@fossiq/lezer-grammar-generator";
import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { grammarDefinition } from "../src/grammar/index";

/**
 * Generate the Lezer .grammar file from the merged plugin architecture.
 *
 * The grammar definition is now assembled from plugins in src/grammar/plugins/
 * and merged via src/grammar/index.ts.
 */
const def = grammarDefinition;

// Validate the grammar definition before generation
const validation = validateGrammar(def);
if (!validation.ok) {
    console.error("Grammar validation failed:");
    for (const issue of validation.issues) {
        console.error(`  [${issue.level}] ${issue.message}`);
    }
    process.exit(1);
}

// Generate the .grammar source text
const grammarText = generateLezerGrammar(def);

// Write the grammar file next to this script
// Resolve __dirname for ESM and compute output path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const outPath = join(__dirname, "..", "src", "kql.grammar");
writeFileSync(outPath, grammarText, "utf8");

console.log(`Generated grammar written to ${outPath}`);
