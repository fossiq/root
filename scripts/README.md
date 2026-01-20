# Release Scripts

Manual release scripts for when automated CI/CD fails.

## Scripts

### `release-all.ts`

Complete release workflow that runs all steps in order:

1. Build all packages
2. Build UI
3. Publish to npm
4. Publish to GitHub Package Registry
5. Create GitHub release
6. Deploy UI to fossiq.github.io

**Usage:**
```bash
export NPM_TOKEN=<your-npm-token>
export GITHUB_TOKEN=<your-github-token>
bun scripts/release-all.ts
# OR
bun run release:manual
```

**Prerequisites:**
- `NPM_TOKEN` environment variable
- `GITHUB_TOKEN` environment variable
- Versions bumped via `bun run version`

### `publish-npm.ts`

Publish all packages to npm registry.

**Usage:**
```bash
export NPM_TOKEN=<your-npm-token>
bun scripts/publish-npm.ts
# OR
bun run publish:npm
```

**Prerequisites:**
- `NPM_TOKEN` environment variable
- All packages built (`bun run build`)

### `publish-github.ts`

Publish all packages to GitHub Package Registry.

**Usage:**
```bash
export GITHUB_TOKEN=<your-github-token>
bun scripts/publish-github.ts
# OR
bun run publish:github
```

**Prerequisites:**
- `GITHUB_TOKEN` environment variable (with `packages:write` scope)
- All packages built (`bun run build`)

### `create-release.ts`

Create a GitHub release from the current version.

**Usage:**
```bash
export GITHUB_TOKEN=<your-github-token>
bun scripts/create-release.ts
# OR
bun run create:release
```

**Prerequisites:**
- `GITHUB_TOKEN` environment variable
- Versions bumped and committed
- Changes pushed to GitHub

**What it does:**
- Creates git tag `v<version>`
- Pushes tag to GitHub
- Creates GitHub release with changelog notes
- Links to published npm packages

### `deploy-ui.ts`

Deploy UI to fossiq.github.io repository.

**Usage:**
```bash
# With SSH key (recommended)
bun scripts/deploy-ui.ts "optional commit message"

# With GitHub token
export GITHUB_TOKEN=<your-github-token>
bun scripts/deploy-ui.ts "optional commit message"

# OR
bun run deploy:ui
```

**Prerequisites:**
- SSH key for `git@github.com:fossiq/fossiq.github.io.git`
  OR `GITHUB_TOKEN` environment variable
- UI built (`cd packages/ui && bun run build`)

**What it does:**
- Clones fossiq.github.io repo
- Removes old files (preserves `.git` and `CNAME`)
- Copies new files from `packages/ui/dist`
- Commits and pushes changes

## Token Setup

### NPM Token

1. Go to https://www.npmjs.com/settings/<username>/tokens
2. Click "Generate New Token" → "Classic Token"
3. Select "Automation" type
4. Copy token and export: `export NPM_TOKEN=<token>`

### GitHub Token

1. Go to https://github.com/settings/tokens/new
2. Select scopes:
   - `repo` (for releases)
   - `packages:write` (for GitHub registry)
3. Generate token
4. Copy token and export: `export GITHUB_TOKEN=<token>`

## Workflow Example

Complete manual release from scratch:

```bash
# 1. Create changeset (if not already done)
bun run changeset

# 2. Version packages
bun run version

# 3. Commit version changes
git add .
git commit -m "chore: version packages"
git push

# 4. Set tokens
export NPM_TOKEN=<your-npm-token>
export GITHUB_TOKEN=<your-github-token>

# 5. Run complete release
bun run release:manual

# Done! Check:
# - npm: https://www.npmjs.com/org/fossiq
# - GitHub packages: https://github.com/orgs/fossiq/packages
# - Releases: https://github.com/fossiq/root/releases
# - UI: https://fossiq.github.io
```

## Troubleshooting

### npm publish fails with 401

- Check NPM_TOKEN is set: `echo $NPM_TOKEN`
- Verify token has automation/publish permissions
- Ensure you're logged into npm: `npm whoami`

### GitHub publish fails with 403

- Check GITHUB_TOKEN is set: `echo $GITHUB_TOKEN`
- Verify token has `packages:write` scope
- Ensure package names are scoped: `@fossiq/<package>`

### UI deployment fails

- For SSH: Verify SSH key is added to fossiq.github.io repo settings
- For HTTPS: Ensure GITHUB_TOKEN has `repo` scope
- Check UI is built: `ls packages/ui/dist`

### Release creation fails

- Ensure version tag doesn't already exist: `git tag -l`
- Check GITHUB_TOKEN has `repo` scope
- Verify you're on correct branch and pushed commits

## Notes

- All packages use same version (fixed versioning via changesets)
- UI package is private and won't be published to npm
- Scripts use `bun` and require Bun runtime
- Scripts will exit with error on first failure
- Safe to re-run individual scripts if one fails
