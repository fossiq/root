#!/usr/bin/env node
/**
 * Grammar Compiler
 * Compiles TypeScript grammar rules into a JavaScript grammar.js file
 * that tree-sitter can understand
 */

import { writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import type { Rule, GrammarConfig } from "./types.js";
import { createGrammar } from "./index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Serializes a Rule object into JavaScript source code
 */
function serializeRule(rule: Rule, indent: string = "  "): string {
  if (!rule || typeof rule !== "object") {
    console.error("Invalid rule:", rule);
    throw new Error(`Invalid rule: ${JSON.stringify(rule)}`);
  }

  if (!rule.type) {
    console.error("Rule missing type property:", rule);
    throw new Error(`Rule missing type property: ${JSON.stringify(rule)}`);
  }

  switch (rule.type) {
    case "STRING":
      return JSON.stringify(rule.value);

    case "PATTERN": {
      // Escape forward slashes in regex patterns
      const escapedPattern = rule.value.replace(/\//g, "\\/");
      return `/${escapedPattern}/`;
    }

    case "SYMBOL":
      return `$.${rule.name}`;

    case "SEQ":
      return `seq(${rule.members
        .map((r) => serializeRule(r, indent))
        .join(", ")})`;

    case "CHOICE":
      if (
        rule.members &&
        rule.members.length === 2 &&
        rule.members[1].type === "BLANK"
      ) {
        // This is an optional
        return `optional(${serializeRule(rule.members[0], indent)})`;
      }
      return `choice(${rule.members
        ?.map((r) => serializeRule(r, indent))
        .join(", ")})`;

    case "REPEAT":
      return `repeat(${serializeRule(rule.content, indent)})`;

    case "REPEAT1":
      return `repeat1(${serializeRule(rule.content, indent)})`;

    case "PREC":
      return `prec(${rule.value}, ${serializeRule(rule.content, indent)})`;

    case "PREC_LEFT":
      if (rule.value === 0) {
        return `prec.left(${serializeRule(rule.content, indent)})`;
      }
      return `prec.left(${rule.value}, ${serializeRule(rule.content, indent)})`;

    case "PREC_RIGHT":
      if (rule.value === 0) {
        return `prec.right(${serializeRule(rule.content, indent)})`;
      }
      return `prec.right(${rule.value}, ${serializeRule(
        rule.content,
        indent
      )})`;

    case "PREC_DYNAMIC":
      return `prec.dynamic(${rule.value}, ${serializeRule(
        rule.content,
        indent
      )})`;

    case "TOKEN":
      return `token(${serializeRule(rule.content, indent)})`;

    case "ALIAS":
      return `alias(${serializeRule(rule.content, indent)}, ${JSON.stringify(
        rule.value
      )})`;

    case "FIELD":
      return `field(${JSON.stringify(rule.name)}, ${serializeRule(
        rule.content,
        indent
      )})`;

    case "BLANK":
      return "blank()";

    default:
      throw new Error(`Unknown rule type: ${(rule as { type: string }).type}`);
  }
}

/**
 * Generates the grammar.js file content
 */
function generateGrammarJS(config: GrammarConfig): string {
  const rules: string[] = [];

  for (const [name, rule] of Object.entries(config.rules)) {
    try {
      const serialized = serializeRule(rule, "    ");
      rules.push(`    ${name}: ($) => ${serialized}`);
    } catch (error) {
      console.error(`Error serializing rule '${name}':`, rule);
      throw error;
    }
  }

  let extrasSection = "";
  if (config.extras && config.extras.length > 0) {
    const extrasArray = config.extras
      .map((extra) => {
        const serialized = serializeRule(extra, "    ");
        // Wrap pattern-based extras in token() for proper lexing
        if (extra.type === "PATTERN") {
          return `token(${serialized})`;
        }
        return serialized;
      })
      .join(",\n    ");
    extrasSection = `\n\n  extras: $ => [\n    ${extrasArray}\n  ],`;
  }

  let conflictsSection = "";
  if (config.conflicts && config.conflicts.length > 0) {
    const conflictArrays = config.conflicts
      .map((conflict) => `[${conflict.map((c) => `$.${c}`).join(", ")}]`)
      .join(",\n    ");
    conflictsSection = `\n\n  conflicts: $ => [\n    ${conflictArrays}\n  ],`;
  }

  return `module.exports = grammar({
  name: '${config.name}',${extrasSection}${conflictsSection}

  rules: {
${rules.join(",\n")},
  }
});
`;
}

/**
 * Main compilation function
 */
function compile() {
  console.log("Compiling KQL grammar...");

  try {
    // Create the grammar configuration
    const grammar = createGrammar();

    // Generate JavaScript source
    const jsSource = generateGrammarJS(grammar);

    // Write to grammar.js (tree-sitter-cli expects this name)
    // Note: We output CommonJS syntax since tree-sitter expects it
    const outputPath = resolve(__dirname, "../../grammar.js");
    writeFileSync(outputPath, jsSource, "utf-8");

    console.log(`✓ Grammar compiled successfully to ${outputPath}`);
  } catch (error) {
    console.error("✗ Grammar compilation failed:", error);
    process.exit(1);
  }
}

// Run the compiler
compile();
