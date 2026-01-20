/**
 * Prepends TypeScript/ESLint ignore directives to generated parser files.
 * The lezer-generator output has implicit any types we don't need to fix.
 */

import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const parserFile = join(__dirname, "../src/parser.ts");

const header = `// This is a generated file. Type checking is disabled to simplify maintenance.
// The lezer-generator output has implicit any types that are safe to ignore.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
`;

const content = readFileSync(parserFile, "utf-8");
writeFileSync(parserFile, header + content);
