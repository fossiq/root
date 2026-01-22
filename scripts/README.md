# Release Scripts

Scripts for package publishing. Most release steps are automated via GitHub Actions.

## Automated (CI)

When you merge a PR with changesets to `main`:

1. **CI runs** → lint, build, test
2. **Changesets action** → creates a "chore: release packages" PR with version bumps
3. **Merge that PR** → CI runs again, then:
   - `release-ci.ts` runs: build → publish to GitHub Packages → create GitHub Release
   - UI deploys to fossiq.github.io

## Manual (npm only)

npm publishing requires interactive authentication and must be done locally after each release.

```bash
# After the automated release completes:
bun run publish:npm
```

## Scripts

| Script              | Purpose                                           | Used By         |
| ------------------- | ------------------------------------------------- | --------------- |
| `release-ci.ts`     | Orchestrates CI release (build, publish, release) | GitHub Actions  |
| `publish-github.ts` | Publish packages to GitHub Package Registry       | `release-ci.ts` |
| `create-release.ts` | Create GitHub Release with changelog              | `release-ci.ts` |
| `publish-npm.ts`    | Publish packages to npm (manual)                  | You, locally    |

## Complete Release Workflow

```bash
# 1. Create a changeset for your changes
bun run changeset

# 2. Commit and push, open PR
git add . && git commit -m "feat: your feature"
git push && gh pr create

# 3. Merge PR → CI creates "chore: release packages" PR automatically

# 4. Merge the release PR → packages published to GitHub, UI deployed

# 5. Manually publish to npm
bun run publish:npm
```

## Token Setup

### npm (for manual publishing)

```bash
# Option 1: Login interactively
npm login

# Option 2: Use token
export NPM_TOKEN=<your-token>
```

### GitHub (automatic in CI, optional for local)

```bash
# Usually not needed - gh CLI handles auth
# If needed:
export GITHUB_TOKEN=<your-token>
```

## Troubleshooting

### npm publish fails

- Ensure you're logged in: `npm whoami`
- Check token permissions at https://www.npmjs.com/settings/tokens

### GitHub publish fails with 403

- Check `GITHUB_TOKEN` has `packages:write` scope
- In CI, this is automatic via `secrets.GITHUB_TOKEN`

### Version already exists

- Scripts skip already-published versions automatically
- This is normal if re-running after a partial failure
