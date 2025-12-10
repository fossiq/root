#!/bin/bash
# Triggers UI deployment by pushing a commit to fossiq.github.io
# Requires DEPLOY_KEY_GITHUB_IO secret to be passed via environment

set -e

eval "$(ssh-agent -s)"
ssh-add - <<< "$DEPLOY_KEY_GITHUB_IO"

git clone git@github.com:fossiq/fossiq.github.io.git /tmp/github-io
cd /tmp/github-io

date > .last-deploy
git config user.name "github-actions[bot]"
git config user.email "github-actions[bot]@users.noreply.github.com"
git add .last-deploy
git commit -m "chore: trigger deploy from fossiq/root"
git push

echo "✓ UI deployment triggered"
