#!/usr/bin/env bun
import { $ } from "bun";

/**
 * CI release script called by changesets/action after version bump PR is merged.
 *
 * Steps:
 * 1. Build all packages
 * 2. Publish to GitHub Package Registry
 * 3. Create GitHub release with changelog
 *
 * Note: npm publishing is manual and not included here.
 */

async function main() {
  console.log("=== CI Release ===\n");

  console.log("📦 Building packages...");
  await $`bun run build`;

  console.log("\n🚀 Publishing to GitHub Packages...");
  await $`bun run publish:github`;

  console.log("\n🏷️  Creating GitHub Release...");
  await $`bun run create:release`;

  console.log("\n✅ CI Release complete");
}

main().catch((error) => {
  console.error("❌ Release failed:", error);
  process.exit(1);
});
