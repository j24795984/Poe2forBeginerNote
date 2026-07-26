---
name: design-reference-library
description: Select and apply a project-appropriate frontend design direction from the bundled Awesome DESIGN.md reference library. Use for visual frontend creation, redesigns, or design-system decisions when a specific visual language, palette, typography system, or product-style reference would help.
---

# Design Reference Library

## Overview

Use the bundled reference systems to establish a coherent visual direction before implementation. The references are inspiration and design constraints, not permission to copy a brand identity, trademark, proprietary assets, or product content.

## Workflow

1. Inspect `references/awesome-design-md/` and choose one reference that suits the requested product and audience. Prefer the project's existing style when extending an established interface.
2. Read only the selected reference's `DESIGN.md`; do not load the entire library. Use `rg --files references/awesome-design-md` to find candidates efficiently.
3. Translate its reusable principles — layout density, color roles, typography hierarchy, spacing, component states, and responsive behavior — into this project's tokens and components.
4. State the selected reference and the principles being adapted. Do not represent the resulting work as affiliated with or endorsed by the reference brand.
5. Verify that the implementation remains accessible, responsive, and consistent with the project rather than duplicating branded visual assets.

## Reference layout

Each directory under `references/awesome-design-md/` contains a `DESIGN.md` plus visual preview files. Read `DESIGN.md` for agent guidance; use previews only when visual inspection is necessary.

