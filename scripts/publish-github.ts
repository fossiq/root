#!/usr/bin/env bun
import { $ } from "bun";

/**
 * Manually publish all packages to GitHub Package Registry
 *
 * Prerequisites:
 * - GITHUB_TOKEN environment variable set (with packages:write scope)
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

async function publishToGitHub() {
  console.log("=== Publishing to GitHub Package Registry ===\n");

  if (!process.env.GITHUB_TOKEN) {
    console.error("❌ GITHUB_TOKEN environment variable not set");
    console.error("Run: export GITHUB_TOKEN=<your-token>");
    process.exit(1);
  }

  // Create .npmrc for GitHub registry
  await $`echo "//npm.pkg.github.com/:_authToken=\${GITHUB_TOKEN}" > /tmp/.npmrc-github`;
  await $`echo "@fossiq:registry=https://npm.pkg.github.com" >> /tmp/.npmrc-github`;

  for (const pkg of packages) {
    const pkgPath = `packages/${pkg}`;
    console.log(`\n📦 Publishing @fossiq/${pkg} to GitHub...`);

    try {
      await $`cd ${pkgPath} && npm publish --registry=https://npm.pkg.github.com --userconfig /tmp/.npmrc-github`;
      console.log(`✅ @fossiq/${pkg} published to GitHub successfully`);
    } catch (error) {
      console.error(`❌ Failed to publish @fossiq/${pkg} to GitHub:`, error);
      process.exit(1);
    }
  }

  // Cleanup
  await $`rm -f /tmp/.npmrc-github`;

  console.log("\n✅ All packages published to GitHub Package Registry successfully!");
}

publishToGitHub();
