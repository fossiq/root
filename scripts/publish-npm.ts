#!/usr/bin/env bun
import { $ } from "bun";

/**
 * Manually publish all packages to npm registry
 *
 * Prerequisites:
 * - NPM_TOKEN environment variable set
 * - All packages built (run `bun run build` first)
 * - Version bumps applied (run `bun run version` first if using changesets)
 */

const packages = [
  "kql-ast",
  "kql-lezer",
  "kql-to-duckdb",
  "lezer-grammar-generator",
  // ui is private, skip
];

async function publishToNpm() {
  console.log("=== Publishing to npm ===\n");

  if (!process.env.NPM_TOKEN) {
    console.error("❌ NPM_TOKEN environment variable not set");
    console.error("Run: export NPM_TOKEN=<your-token>");
    process.exit(1);
  }

  // Create .npmrc for authentication
  await $`echo "//registry.npmjs.org/:_authToken=\${NPM_TOKEN}" > /tmp/.npmrc`;

  for (const pkg of packages) {
    const pkgPath = `packages/${pkg}`;
    console.log(`\n📦 Publishing @fossiq/${pkg}...`);

    try {
      await $`cd ${pkgPath} && npm publish --access public --provenance --userconfig /tmp/.npmrc`;
      console.log(`✅ @fossiq/${pkg} published successfully`);
    } catch (error) {
      console.error(`❌ Failed to publish @fossiq/${pkg}:`, error);
      process.exit(1);
    }
  }

  // Cleanup
  await $`rm -f /tmp/.npmrc`;

  console.log("\n✅ All packages published to npm successfully!");
}

publishToNpm();
