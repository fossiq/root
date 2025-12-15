# CI Build Debug Log

This document captures the recent debugging history for the Fossiq CI pipeline along with the guiding goals that now shape our workflow design.

## Pipeline Goals

1. **Deterministic builds across platforms**

   - Lint, build, test, and publish stages must run on modern GitHub-hosted runners (Ubuntu 24.04 x64, macOS 15 ARM64/x64, Windows Server 2025 x64, Windows 11 ARM64). The Ubuntu 22.04 ARM64 job is temporarily disabled while we stabilize Tree-sitter CLI availability on that platform, and the Windows 11 ARM64 job is paused until Bun provides a working download endpoint for that runner.
   - Linux builds must remain compatible with Tree-sitter’s GLIBC requirements without relying on custom host setups.

2. **Single source of truth for artifacts**

   - Linux builds produce the canonical artifacts (including WASM for `@fossiq/kql-parser`). Non-Linux builds replicate dist outputs so publishing can merge everything deterministically.

3. **Bun-first toolchain**

   - All workflow steps assume Bun is the runtime (setup via `oven-sh/setup-bun`). Node.js is available only when required by transitive dependencies (e.g., `node-gyp` under Tree-sitter).

4. **Minimal debugging friction**
   - Runner issues, container mismatches, or toolchain gaps must be documented here so future changes can proceed with full context.

## Debugging Timeline

| Date/Phase                           | Issue                                                                                                                                                                                                                                          | Investigation & Outcome                                                                                                                                                                                              |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Initial runner uplift                | Align runners with GitHub’s 2024 images (Ubuntu 24.04, macOS 15, Windows 2025).                                                                                                                                                                | Lint/tests/publish updated accordingly; non-Linux jobs kept native runners.                                                                                                                                          |
| GLIBC mismatch on Ubuntu ARM         | Tree-sitter CLI failed with `/lib/aarch64-linux-gnu/libc.so.6: version 'GLIBC_2.39' not found`.                                                                                                                                                | Split Linux builds into containerized job using Ubuntu 24.04 base image so host GLIBC no longer dictated behavior.                                                                                                   |
| Tree-sitter CLI override needed      | Inconsistent CLI resolution across environments.                                                                                                                                                                                               | `packages/kql-parser/scripts/generate.ts` rebuilt to honor `TREE_SITTER_CLI`, then fall back to `node_modules/.bin/tree-sitter`, then `bun x tree-sitter`.                                                           |
| Container image lacked build tools   | Bare `ubuntu:24.04` images were missing `unzip`, `node-gyp`, etc.                                                                                                                                                                              | Temporarily added manual `apt-get install` step.                                                                                                                                                                     |
| Image swap to devcontainers base     | Adopted `mcr.microsoft.com/devcontainers/base:ubuntu-24.04` to include dev tooling by default.                                                                                                                                                 | Resolved initial missing utilities but revealed additional needs for Node-focused tooling.                                                                                                                           |
| Node-focused image experiment        | Switched to `mcr.microsoft.com/devcontainers/typescript-node`.                                                                                                                                                                                 | Provided integrated tooling but introduced pull failures (`manifest ... not found`) for unavailable tags.                                                                                                            |
| Container pull failures              | Runner job failed before caching step (`ContainerId` null) because the tag `1-ubuntu-24.04` does not exist.                                                                                                                                    | Attempted alternate tags (e.g., `1-ubuntu-22.04`), but mismatch between runner OS (24.04) and container (22.04) added maintenance risk.                                                                              |
| Decision: revert to default runners  | Containers created more churn than stability benefits once tooling gaps were addressed.                                                                                                                                                        | Linux builds now run on GitHub-hosted Ubuntu runners directly. Bun/Tree-sitter builds rely on the preinstalled toolchain, with additional package installs handled at the workflow step level if genuinely required. |
| Tree-sitter CLI removal              | Removed the direct dependency on `tree-sitter-cli` by switching scripts and tests to the `tree-sitter` binary (per https://github.com/tree-sitter/tree-sitter/pull/260), eliminating GLIBC-locked binaries and simplifying Bun-based installs. | Parser scripts/tests now call `tree-sitter`, documentation was updated, and CI no longer downloads the CLI binary, keeping the toolchain fully Bun-managed.                                                          |
| Temporary removal of Linux ARM build | Tree-sitter CLI binary downloads on `ubuntu-22.04-arm` continued to produce x64 executables, breaking parser generation.                                                                                                                       | Removed the linux-arm entry from the build matrix until we have a reliable CLI source for ARM64 runners; re-enable once the upstream installer supplies architecture-correct binaries.                               |
| Windows ARM Bun installer failures   | Bun downloads on `windows-11-arm` returned 404 responses (`https://bun.sh/download/latest/win32/arm64?avx2=true&profile=false`), preventing the runner from installing the runtime.                                                            | Removed the win32-arm64 job from the non-Linux matrix until Bun publishes a stable Windows ARM artifact; revisit once the download endpoint consistently serves binaries.                                            |
| Upload directory layout fix          | `cp -r packages/*/dist upload/packages/` tried to overwrite `upload/packages/<pkg>` directly, leading to “Not a directory” when the destination path already existed as a file placeholder.                                                    | Switched to per-package subdirectories and explicit `dist` copies so artifact staging succeeds on both Linux and non-Linux builders.                                                                                 |
| Artifact download naming mismatch    | Test and publish stages failed to find `built-packages-linux-x64` because the upload step only archived the WASM glob, leaving the package directories out of the artifact.                                                                    | Updated the upload configuration to include the entire `upload/packages` tree alongside the optional WASM file so the artifact names now match what downstream steps request.                                        |
| Windows shell enforcement            | Windows runners defaulted to PowerShell, so our Bash loops in artifact preparation and build steps crashed with syntax errors.                                                                                                                 | Set the non-Linux matrix job default shell to Bash and explicitly marked Bash for the multi-line steps so POSIX scripts run consistently on Windows.                                                                 |

## References

- Internal thread: **CI workflow runner matrix update** (contains rationale for runner selection changes and GLIBC mitigation strategies).
- Internal thread: **Fastify Bun PR Matrix Pipeline Review** (documents simplification from matrix testing to Bun + Fastify only, informing our Bun-first CI strategy).

## Next Steps

1. Monitor current CI runs on default runners to ensure:

   - Tree-sitter builds continue to succeed on Ubuntu 24.04 x64 while the ARM runner remains paused.
   - Artifact downloads/upload remain stable across publish stages.

2. Track upstream Tree-sitter CLI fixes for aarch64 and plan for re-enabling the `ubuntu-22.04-arm` job once architecture-correct binaries are available consistently.

3. Coordinate with the Bun team (or monitor release notes) for a Windows ARM download endpoint that stays live, then restore the `windows-11-arm` job once the installer succeeds consistently.

4. Validate the per-package upload directory scaffolding whenever packages are added or renamed so artifact staging remains aligned with the repository layout.

5. If future dependencies require additional native tooling, prefer scoped `apt-get install` steps instead of swapping entire container images.

5. Reconfirm that each platform’s artifact upload path matches the names the downstream download steps expect (for example, `built-packages-linux-x64`) whenever the staging structure changes.
6. When adding or modifying Windows workflow steps that rely on POSIX shell features, ensure `shell: bash` (or an equivalent) is specified so scripts don’t silently fall back to PowerShell.

7. If future dependencies require additional native tooling, prefer scoped `apt-get install` steps instead of swapping entire container images.

8. Keep this log updated whenever CI infrastructure changes—especially when experimenting with new runner types, container images, or build tools.
