import { readFileSync } from "fs";
import { join } from "path";
import { $ } from "bun";

async function main() {
    console.log("Creating GitHub release...");

    try {
        // Read version from package.json
        const packageJsonPath = join(
            process.cwd(),
            "packages",
            "kql-to-duckdb",
            "package.json",
        );
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
        const version = packageJson.version;

        console.log(`Checking if release v${version} already exists...`);

        try {
            // Check if release already exists
            await $`gh release view "v${version}" --json tagName`;
            console.log(`⚠ Release v${version} already exists - skipping`);
        } catch (error) {
            // Release doesn't exist, create it
            console.log(`Creating release v${version}...`);
            await $`gh release create "v${version}" --title "v${version}" --notes "Release v${version} - see individual package CHANGELOGs for details"`;
            console.log(`✓ Release v${version} created`);
        }
    } catch (error) {
        console.error("Failed to create release:", error);
        process.exit(1);
    }
}

main();
