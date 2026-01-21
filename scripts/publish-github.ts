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

  let token = process.env.GITHUB_TOKEN;
  let usingTempConfig = false;

  if (!token) {
    try {
      console.log("ℹ️  GITHUB_TOKEN not set. Trying 'gh auth token'...");
      token = (await $`gh auth token`.text()).trim();
      if (token) {
        console.log("✅ Obtained token from gh CLI");
      }
    } catch (e) {
      console.log("ℹ️  Could not get token from gh CLI.");
    }
  }

  if (token) {
    // Create .npmrc for GitHub registry
    await $`echo "//npm.pkg.github.com/:_authToken=${token}" > /tmp/.npmrc-github`;
    await $`echo "@fossiq:registry=https://npm.pkg.github.com" >> /tmp/.npmrc-github`;
    usingTempConfig = true;
  } else {
    console.log(
      "⚠️  No token found. Assuming global .npmrc is configured for @fossiq registry."
    );
  }

  for (const pkg of packages) {
    const pkgPath = `packages/${pkg}`;
    console.log(`\n📦 Publishing @fossiq/${pkg} to GitHub...`);

    try {
      if (usingTempConfig) {
        await $`cd ${pkgPath} && npm publish --registry=https://npm.pkg.github.com --userconfig /tmp/.npmrc-github --no-provenance`;
      } else {
        await $`cd ${pkgPath} && npm publish --registry=https://npm.pkg.github.com --no-provenance`;
      }
      console.log(`✅ @fossiq/${pkg} published to GitHub successfully`);
    } catch (error) {
      // Check if error is due to version already existing
      // Bun's ShellError has stderr property that contains npm's error output
      const errorStr = error?.toString() || "";
      const stderr = (error as any)?.stderr?.toString() || "";
      const combinedError = errorStr + " " + stderr;

      if (
        combinedError.includes("EPUBLISHCONFLICT") ||
        combinedError.includes("cannot publish over") ||
        combinedError.includes("previously published versions") ||
        combinedError.includes(
          "You cannot publish over the previously published versions"
        )
      ) {
        console.log(
          `⚠️  @fossiq/${pkg} version already exists in registry, skipping`
        );
        continue;
      }
      console.error(`❌ Failed to publish @fossiq/${pkg} to GitHub:`);
      console.error(`Error: ${errorStr}`);
      if (stderr) {
        console.error(`stderr: ${stderr}`);
      }
      process.exit(1);
    }
  }

  // Cleanup
  if (usingTempConfig) {
    await $`rm -f /tmp/.npmrc-github`;
  }

  console.log(
    "\n✅ All packages published to GitHub Package Registry successfully!"
  );
}

publishToGitHub();
