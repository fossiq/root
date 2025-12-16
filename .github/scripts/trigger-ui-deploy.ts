import { $ } from "bun";
import { join } from "path";

async function main() {
  console.log("=== Setting up SSH ===");
  
  try {
    // This script requires DEPLOY_KEY_GITHUB_IO secret to be passed via environment
    if (!process.env.DEPLOY_KEY_GITHUB_IO) {
      throw new Error("DEPLOY_KEY_GITHUB_IO environment variable is required");
    }
    
    // Start SSH agent and add key
    await $`eval "$(ssh-agent -s)"`;
    await $`ssh-add - <<< "${process.env.DEPLOY_KEY_GITHUB_IO}"`;
    
    console.log("=== Cloning fossiq.github.io ===");
    await $`git clone git@github.com:fossiq/fossiq.github.io.git /tmp/github-io`;
    
    console.log("=== Copying built files ===");
    process.chdir("/tmp/github-io");
    
    // Remove old files (except .git and CNAME if exists)
    await $`find . -maxdepth 1 ! -name '.git' ! -name 'CNAME' ! -name '.' -exec rm -rf {} +`;
    
    // Copy new files from dist
    const distDir = join(process.env.GITHUB_WORKSPACE || "", "packages", "ui", "dist");
    await $`cp -r ${distDir}/* .`;
    
    console.log("=== Committing and pushing ===");
    await $`git config user.name "github-actions[bot]"`;
    await $`git config user.email "github-actions[bot]@users.noreply.github.com"`;
    await $`git add -A`;
    
    // Check if there are changes to commit
    const diffResult = await $`git diff --staged --quiet`.catch(() => "changes");
    
    if (diffResult === "changes") {
      const commitMessage = `deploy: update from fossiq/root@${process.env.GITHUB_SHA?.substring(0, 7) || "unknown"}`;
      await $`git commit -m "${commitMessage}"`;
      await $`git push`;
      console.log("✓ UI deployed successfully");
    } else {
      console.log("⚠ No changes to deploy - skipping");
    }
  } catch (error) {
    console.error("Failed to deploy UI:", error);
    process.exit(1);
  }
}

main();