#!/usr/bin/env bun
import { $ } from "bun";

/**
 * Complete manual release workflow
 *
 * This script runs the entire release process:
 * 1. Build all packages
 * 2. Publish to npm
 * 3. Publish to GitHub Package Registry
 * 4. Create GitHub release
 * 5. Deploy UI to fossiq.github.io
 *
 * Prerequisites:
 * - NPM_TOKEN environment variable
 * - GITHUB_TOKEN environment variable
 * - SSH key for fossiq.github.io OR use GITHUB_TOKEN
 * - Version bumps applied (run `bun run version` first)
 */

async function releaseAll() {
  console.log("=== Complete Release Workflow ===\n");

  // Verify environment variables (optional if logged in via CLI)
  if (!process.env.NPM_TOKEN || !process.env.GITHUB_TOKEN) {
    console.log(
      "ℹ️  NPM_TOKEN or GITHUB_TOKEN not set. Assuming you are logged in via npm/gh CLIs."
    );
  }

  try {
    // Step 1: Build all packages
    console.log("\n📦 Step 1: Building all packages...\n");
    await $`bun run build`;
    console.log("✅ Build complete\n");

    // Step 2: Build UI
    console.log("🎨 Step 2: Building UI...\n");
    await $`cd packages/ui && bun run build`;
    console.log("✅ UI build complete\n");

    // Step 3: Publish to npm
    console.log("📤 Step 3: Publishing to npm...\n");
    await $`bun scripts/publish-npm.ts`;

    // Step 4: Publish to GitHub
    console.log("\n📤 Step 4: Publishing to GitHub Package Registry...\n");
    await $`bun scripts/publish-github.ts`;

    // Step 5: Create GitHub release
    console.log("\n🚀 Step 5: Creating GitHub release...\n");
    await $`bun scripts/create-release.ts`;

    // Step 6: Deploy UI
    console.log("\n🌐 Step 6: Deploying UI...\n");
    await $`bun scripts/deploy-ui.ts`;

    console.log("\n\n🎉 Release complete!");
    console.log("\n📦 Packages published to:");
    console.log("  - npm: https://www.npmjs.com/org/fossiq");
    console.log("  - GitHub: https://github.com/orgs/fossiq/packages");
    console.log("\n🚀 Release: https://github.com/fossiq/root/releases");
    console.log("🌐 UI: https://fossiq.github.io");
  } catch (error) {
    console.error("\n❌ Release failed:", error);
    process.exit(1);
  }
}

releaseAll();
