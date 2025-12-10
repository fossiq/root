#!/bin/bash
# Deploys built UI files to fossiq.github.io
# UI is already built by turborepo in the build step
# Requires DEPLOY_KEY_GITHUB_IO secret to be passed via environment

set -e

echo "=== Setting up SSH ==="
eval "$(ssh-agent -s)"
ssh-add - <<< "$DEPLOY_KEY_GITHUB_IO"

echo "=== Cloning fossiq.github.io ==="
git clone git@github.com:fossiq/fossiq.github.io.git /tmp/github-io

echo "=== Copying built files ==="
# Remove old files (except .git and CNAME if exists)
cd /tmp/github-io
find . -maxdepth 1 ! -name '.git' ! -name 'CNAME' ! -name '.' -exec rm -rf {} +

# Copy new files from dist
cp -r $GITHUB_WORKSPACE/packages/ui/dist/* .

echo "=== Committing and pushing ==="
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"
git add -A

if git diff --staged --quiet; then
  echo "⚠ No changes to deploy - skipping"
else
  git commit -m "deploy: update from fossiq/root@${GITHUB_SHA:0:7}"
  git push
  echo "✓ UI deployed successfully"
fi
