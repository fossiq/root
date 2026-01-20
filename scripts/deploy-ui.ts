#!/usr/bin/env bun
import { $ } from "bun";
import { join } from "path";
import { existsSync } from "fs";

/**
 * Deploy UI to fossiq.github.io repository
 *
 * Prerequisites:
 * - SSH key configured for git@github.com:fossiq/fossiq.github.io.git
 *   OR GITHUB_TOKEN with repo access
 * - UI built (cd packages/ui && bun run build)
 *
 * Usage:
 *   bun scripts/deploy-ui.ts [commit-message]
 */

async function deployUI() {
  console.log("=== Deploying UI to fossiq.github.io ===\n");

  const commitMessage = process.argv[2] || `deploy: update from fossiq/root@${await $`git rev-parse --short HEAD`.text()}`;

  // Check if UI dist exists
  const distPath = join(process.cwd(), "packages", "ui", "dist");
  if (!existsSync(distPath)) {
    console.error("❌ UI dist not found. Run: cd packages/ui && bun run build");
    process.exit(1);
  }

  console.log("📦 UI dist found at:", distPath);

  // Clone fossiq.github.io (or use HTTPS with token)
  const cloneUrl = process.env.GITHUB_TOKEN
    ? `https://${process.env.GITHUB_TOKEN}@github.com/fossiq/fossiq.github.io.git`
    : "git@github.com:fossiq/fossiq.github.io.git";

  console.log("\n📥 Cloning fossiq.github.io...");
  const tmpDir = "/tmp/fossiq-github-io";
  await $`rm -rf ${tmpDir}`;
  await $`git clone ${cloneUrl} ${tmpDir}`;

  console.log("\n🗑️  Removing old files...");
  process.chdir(tmpDir);
  await $`find . -maxdepth 1 ! -name '.git' ! -name 'CNAME' ! -name '.' -exec rm -rf {} + || true`;

  console.log("\n📋 Copying new files...");
  await $`cp -r ${distPath}/* .`;

  console.log("\n📊 Checking for changes...");
  const status = await $`git status --porcelain`.text();

  if (!status.trim()) {
    console.log("⚠️  No changes to deploy");
    return;
  }

  console.log("\n✏️  Committing changes...");
  await $`git config user.name "fossiq-bot"`;
  await $`git config user.email "bot@fossiq.dev"`;
  await $`git add -A`;
  await $`git commit -m "${commitMessage}"`;

  console.log("\n📤 Pushing to fossiq.github.io...");
  await $`git push`;

  console.log("\n✅ UI deployed successfully!");
  console.log("🌐 Visit: https://fossiq.github.io");

  // Cleanup
  process.chdir(process.cwd());
  await $`rm -rf ${tmpDir}`;
}

deployUI().catch((error) => {
  console.error("❌ Deployment failed:", error);
  process.exit(1);
});
