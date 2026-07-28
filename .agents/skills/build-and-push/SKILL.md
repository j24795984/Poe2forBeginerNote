---
name: build-and-push
description: Configure and operate automatic GitHub Pages deployment for this Astro site. Use when changing the automatic deployment workflow or when the user explicitly asks to update the website or GitHub Pages; ordinary source updates remain on creating-web and trigger deployment automatically after push.
---

# Build and Push

Deploy `creating-web` source to GitHub Pages through the compiled-only `main` branch.

## Branch contract

- `creating-web` contains all source code and is the normal development branch.
- `main` contains only generated `dist/` files. Never merge `creating-web` into `main`.
- GitHub Pages serves `main` at `/(root)`.

## Automatic deployment

The workflow at `.github/workflows/deploy.yml` runs whenever `creating-web` is pushed. It builds the Astro site and force-pushes only `dist/` to `main`.

For ordinary source changes, commit and push only the current task's changes to `origin/creating-web`. Do not manually build or push `main`; GitHub Actions performs publication automatically. Keep `workflow_dispatch` as a manual fallback.

## Verification

After a deployment-triggering push, confirm the Action succeeds and that `main` contains only static output. Report `https://j24795984.github.io/Poe2forBeginerNote/`.
