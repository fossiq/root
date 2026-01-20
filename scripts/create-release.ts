#!/usr/bin/env bun
import { $ } from "bun";
import { readFileSync } from "fs";

/**
 * Create a GitHub release from changeset information
 *
 * Prerequisites:
 * - GITHUB_TOKEN environment variable set
 * - Packages versioned (run `bun run version` first)
 * - Changes committed and pushed
 */

async function createGitHubRelease() {
  console.log("=== Creating GitHub Release ===\n");

  // Get version from package.json (all packages should have same version)
  const pkgJson = JSON.parse(
    readFileSync("packages/kql-lezer/package.json", "utf-8")
  );
  const version = pkgJson.version;
  const tag = `v${version}`;

  console.log(`📋 Version: ${version}`);
  console.log(`🏷️  Tag: ${tag}\n`);

  // Read changelog to get release notes
  let releaseNotes = "";
  const changelogPath = "packages/kql-lezer/CHANGELOG.md";

  try {
    const changelog = readFileSync(changelogPath, "utf-8");
    const versionMatch = changelog.match(
      new RegExp(`## ${version}[\\s\\S]*?(?=\\n## |$)`)
    );
    if (versionMatch) {
      releaseNotes = versionMatch[0].replace(`## ${version}`, "").trim();
    }
  } catch (error) {
    console.warn(
      "⚠️  Could not read CHANGELOG.md, using generic release notes"
    );
  }

  if (!releaseNotes) {
    releaseNotes = "See individual package CHANGELOGs for details.";
  }

  // Create git tag
  console.log("📌 Creating git tag...");
  try {
    await $`git tag -a ${tag} -m "Release ${tag}"`;
    console.log("✅ Tag created");
  } catch (error) {
    console.warn("⚠️  Tag might already exist");
  }

  // Push tag
  console.log("📤 Pushing tag to remote...");
  try {
    await $`git push origin ${tag}`;
  } catch (error) {
    console.warn("⚠️  Failed to push tag (might already exist on remote)");
  }

  // Create GitHub release
  console.log("🚀 Creating GitHub release...");

  const releaseBody = `# Release ${tag}

${releaseNotes}

## Published Packages

- [@fossiq/kql-ast@${version}](https://www.npmjs.com/package/@fossiq/kql-ast)
- [@fossiq/kql-lezer@${version}](https://www.npmjs.com/package/@fossiq/kql-lezer)
- [@fossiq/kql-to-duckdb@${version}](https://www.npmjs.com/package/@fossiq/kql-to-duckdb)
- [@fossiq/lezer-grammar-generator@${version}](https://www.npmjs.com/package/@fossiq/lezer-grammar-generator)
`;

  try {
    // Write notes to a temp file to avoid shell quoting issues
    const notesFile = "/tmp/release-notes.md";
    await $`echo ${releaseBody} > ${notesFile}`;

    await $`gh release create ${tag} --title "Release ${tag}" --notes-file ${notesFile} --verify-tag`;

    // Cleanup
    await $`rm -f ${notesFile}`;

    console.log(`✅ Release created successfully using gh CLI`);
  } catch (error) {
    console.error("❌ Failed to create GitHub release:", error);
    process.exit(1);
  }

  console.log("\n✅ GitHub release created successfully!");
}

createGitHubRelease();
