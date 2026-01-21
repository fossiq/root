#!/usr/bin/env bun
import { $ } from "bun";

/**
 * Complete manual release workflow
 *
 * This script runs the entire release process:
 * 1. Build all packages
 * 2. Publish to GitHub Package Registry
 * 3. Create GitHub release
 * 4. Deploy UI to fossiq.github.io
 * 5. Show instructions for manual npm publishing
 *
 * Prerequisites:
 * - GITHUB_TOKEN environment variable
 * - SSH key for fossiq.github.io OR use GITHUB_TOKEN
 * - Version bumps applied (run `bun run version` first)
 *
 * Note: npm publishing is NOT automated as it requires interactive authentication.
 * You will be prompted to publish to npm manually at the end.
 */

async function releaseAll() {
  console.log("=== Complete Release Workflow ===\n");

  // Verify environment variables (optional if logged in via CLI)
  if (!process.env.GITHUB_TOKEN) {
    console.log(
      "ℹ️  GITHUB_TOKEN not set. Assuming you are logged in via gh CLI."
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

    // Step 3: Publish to GitHub
    console.log("📤 Step 3: Publishing to GitHub Package Registry...\n");
    await $`bun scripts/publish-github.ts`;

    // Step 4: Create GitHub release
    console.log("\n🚀 Step 4: Creating GitHub release...\n");
    await $`bun scripts/create-release.ts`;

    // Step 5: Deploy UI
    console.log("\n🌐 Step 5: Deploying UI...\n");
    await $`bun scripts/deploy-ui.ts`;

    console.log("\n\n🎉 Automated release steps complete!");
    console.log("\n📦 Packages published to:");
    console.log("  - GitHub: https://github.com/orgs/fossiq/packages");
    console.log("\n🚀 Release: https://github.com/fossiq/root/releases");
    console.log("🌐 UI: https://fossiq.github.io");

    // Step 6: npm publishing instructions
    console.log("\n" + "=".repeat(60));
    console.log("📋 MANUAL STEP REQUIRED: npm Publishing");
    console.log("=".repeat(60));
    console.log(
      "\nnpm publishing requires interactive authentication and must be done manually."
    );
    console.log("\nTo publish to npm, run:");
    console.log("\n  export NPM_TOKEN=<your-token>");
    console.log("  bun run publish:npm");
    console.log("\nFollow any authentication prompts from npm.");
    console.log("\nAfter publishing, packages will be available at:");
    console.log("  https://www.npmjs.com/org/fossiq");
    console.log("\n" + "=".repeat(60));
  } catch (error) {
    console.error("\n❌ Release failed:", error);
    process.exit(1);
  }
}

releaseAll();
