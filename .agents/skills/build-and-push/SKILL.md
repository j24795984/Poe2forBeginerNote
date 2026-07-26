---
name: build-and-push
description: Build and deploy this Astro site to GitHub Pages. Use only when the user explicitly says "更新網站", "更新 GitHub Page", "更新github page", or otherwise clearly requests publishing the current site; do not use for ordinary source-code updates on creating-web.
---

# Build and Push

Deploy the current `creating-web` source to GitHub Pages through the compiled-only `main` branch.

## Branch contract

- `creating-web` contains all source code and is the normal development branch.
- `main` contains only the generated `dist/` files. Never merge `creating-web` into `main`.
- The GitHub Pages source is `main` at `/(root)`.

## Normal source updates

Unless the user explicitly requests publication, work only on `creating-web`. Commit and push only the source changes for the current task to `origin/creating-web`; do not build or push `main`.

## Publication workflow

1. Verify the current branch is `creating-web`. Stop if it is not.
2. Review `git status`. Commit and push the current task's source changes to `creating-web`, preserving unrelated user changes.
3. Run `npm run build` and stop on failure.
4. In `dist/`, create a temporary Git repository, commit all generated files, and force-push that commit to `origin/main`. Use the existing `origin` URL and authenticated local Git credentials. Do not push source files to `main`.
5. Confirm `main` contains only static output and report the GitHub Pages URL: `https://j24795984.github.io/Poe2forBeginerNote/`.

The repository workflow at `.github/workflows/deploy.yml` is manual-only (`workflow_dispatch`) as a GitHub UI fallback. Do not add a push trigger to it.
