import { readdir, stat, mkdir, copyFile, access } from "node:fs/promises";
import { join, dirname } from "node:path";

async function directoryExists(path: string): Promise<boolean> {
    try {
        const stats = await stat(path);
        return stats.isDirectory();
    } catch {
        return false;
    }
}

async function fileExists(path: string): Promise<boolean> {
    try {
        await access(path);
        return true;
    } catch {
        return false;
    }
}

async function copyDirectoryContents(src: string, dest: string): Promise<void> {
    // Create destination directory
    await mkdir(dest, { recursive: true });

    // Read source directory
    const entries = await readdir(src, { withFileTypes: true });

    // Copy each entry
    for (const entry of entries) {
        const srcPath = join(src, entry.name);
        const destPath = join(dest, entry.name);

        if (entry.isDirectory()) {
            // Recursively copy subdirectories
            await copyDirectoryContents(srcPath, destPath);
        } else {
            // Copy files
            await copyFile(srcPath, destPath);
        }
    }
}

async function main() {
    console.log("Merging build artifacts...");

    try {
        // Create packages directory
        await mkdir("packages", { recursive: true });

        // Copy linux-x64 artifacts
        const linuxSrc = "temp-linux-x64/packages";
        if (await directoryExists(linuxSrc)) {
            const packages = await readdir(linuxSrc);
            for (const pkg of packages) {
                const srcPath = join(linuxSrc, pkg);
                const destPath = join("packages", pkg);
                if (await directoryExists(srcPath)) {
                    await copyDirectoryContents(srcPath, destPath);
                }
            }
        }

        console.log("✓ Build artifacts merged successfully");
    } catch (error) {
        console.error("Failed to merge build artifacts:", error);
        process.exit(1);
    }
}

main();
