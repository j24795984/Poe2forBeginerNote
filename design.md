# POE2 Beginner Note — Design Baseline

This document records the approved visual and interaction baseline for the current site. Read it in full before changing any page layout or UI styling. Update it whenever an approved change alters the baseline.

## Product and scope

- Static Astro site with Vue islands, deployed under the GitHub Pages base path `/Poe2forBeginerNote/`.
- The active reference page is `/atlas/`, a functional atlas guide with category navigation and dynamically swapped Vue content.
- The visual direction is a dark Path of Exile–inspired field guide: atmospheric world imagery, restrained dark utility UI, gold as the single functional accent, and ornate card corners.
- There is one dark colour mode only. Do not add a light/dark mode toggle.

## Design contracts

- Preserve route paths, category names, JSON data contracts, keyboard-accessible native buttons, and the existing GSAP/Lenis behaviour unless the user explicitly requests a change.
- Use Tailwind utility classes for layout and common styling; use `src/styles/atlas.css` for design tokens, pseudo-elements, container queries, reusable visual effects, and animations.
- Keep the existing `8px` card/button radius unless a component has a deliberately square treatment (the page H1 accent line is square).
- All user-facing typography on the atlas page uses `letter-spacing: .15em`.
- Do not reintroduce native `backdrop-filter` blur for cards; the chosen card treatment is a dark-to-blue translucent gradient.

## Global canvas

- `BaseLayout.astro` owns the fixed, full-viewport background `<picture>` element. It uses `w-full h-lvh object-cover`.
- Background assets:
  - `public/images/poe2-hero-1920x980.webp` — desktop.
  - `public/images/poe2-hero-1280x653.webp` — tablet.
  - `public/images/poe2-mobile-767x1364-cropped.webp` — phone.
- The image is not globally darkened or blurred. On phone the image position is `62% top`.
- The browser’s native scrollbar is hidden. `BaseLayout.astro` renders a fixed custom gold scrollbar that overlays the viewport and must not consume content width. Vue dispatches `site-content-resize` after atlas data/content changes so its thumb length is recalculated.
- Lenis is enabled globally from CDN for smooth scrolling. GSAP and ScrollTrigger are also loaded from CDN.

## Layout and responsive rules

- Main page width: `max-width: 1470px`; horizontal padding is `20px` on small screens and `32px` from the medium breakpoint.
- The atlas workspace is a named inline-size container: `atlas-content`.
- Below container width `42rem`, categories appear as a two-column grid above the detail content.
- From `42rem`, the workspace uses a two-column layout: a `13rem–15rem` left navigation and a fluid detail area. The navigation is sticky with `top: 1.5rem`.
- Main workspace gap: `2rem`, growing to `clamp(2rem, 4cqw, 4rem)` at the container query.
- Navigation item gap: `12px`.
- Detail cards use `28px` separation, increasing to `32px` from the medium breakpoint.

## Typography and hierarchy

- Display/utility font: `Outfit`; body font: `Noto Sans TC`.
- Page H1 is `輿圖 - 目標與明`, with a square gold vertical line before it. The line is `0.5rem` wide and `1em` high.
- Atlas detail heading stack uses a `12px` grid gap for all three pieces, in this order:
  1. `ATLAS INTEL` label in bright gold.
  2. Category title (`text-3xl`, `md:text-4xl`).
  3. Category summary.
- Heading copy retains a deep black shadow with a subtle blue glow so it reads over the unmodified world background.

## Colour system

Base tokens on `.site-body`:

```css
--atlas-yellow: oklch(0.91 0.14 93.86);
--atlas-yellow-bright: oklch(0.96 0.14 93.86);
```

- `--atlas-yellow` is the standard functional gold for headings, links, borders, scrollbar thumb, and numbered content.
- `--atlas-yellow-bright` is reserved for stronger labels such as `ATLAS INTEL`.
- Avoid introducing amber utilities or unrelated accent hues. Warm orange-red is permitted only inside the selected category’s metallic gradient to create non-black shadow depth.

## Atlas category navigation

### Structure and order

Order is fixed unless the user requests otherwise:

1. 初入輿圖
2. 換界石
3. 碑牌
4. 聯盟機制
5. 掉落／養圖
6. 地形

Buttons are native `<button>` elements. Unselected buttons use a translucent black background and subdued light text. They show a pointer cursor and hover state.

### Selected and leaving states

- The selected button has a transparent border (the 1px border still occupies space, preventing layout shifts), a default cursor, and no hover interaction.
- Its metal surface is rendered by `.atlas-category-button::before`, not by the button’s base background.
- Clicking a new category updates the navigation selection immediately. The old selection receives `.atlas-accent-leaving`; its metal layer slides right and then resets off-screen without a reverse visible track.
- The incoming selected metal layer slides in from the left. Both directions use a `0.46s cubic-bezier(.22, .8, .25, 1)` transform transition.
- Button text colour transitions over `0.42s`.

### Metallic surface

- Use an angled, repeating `112deg` gold gradient. It is intentionally yellow-forward with warm dark-gold/orange-red depth rather than black shading.
- The repeat’s first and final colour are both `rgb(232 191 82)` to close the palette.
- Keep `background-color: rgb(232 191 82)` as the same-colour fallback behind the gradient.
- The horizontal repeated background size is `453px`, which aligns the 112deg period; preserve this value together with the animation distance.
- Selected surfaces use `atlas-metal-shift` for a subtle continuous movement:

```css
animation: atlas-metal-shift 22s linear infinite;
@keyframes atlas-metal-shift {
  from { background-position: 0 50%; }
  to { background-position: 453px 50%; }
}
```

- Do not add `repeating-linear-gradient` stripe overlays. They create unwanted visible diagonal/vertical lines.

## Detail content and cards

- The currently visible content is separate from the selected navigation state:
  - `selectedId` drives the immediately updated navigation button.
  - `displayedId` drives the right detail content and changes after exit completes.
- On category change, the detail panel exits with `opacity: 0`, `blur(14px)`, and `y: -10` over `0.42s`; incoming content enters with `opacity: 0 → 1`, `blur(6px) → 0`, and `y: 24 → 0` over `0.62s`.
- Content cards have a translucent gradient exactly as follows:

```css
background: linear-gradient(60deg, rgb(0 0 0 / .6) 20%, rgb(11 57 163 / 20%));
```

- Card content stays above decoration with `z-index: 1`. Cards do not use `overflow: hidden`.
- The user-provided ornament is copied locally to `public/images/atlas-card-ornament.webp`. It is applied using an absolutely positioned `.atlas-content-card-ornament` overlay with `inset: -10px` and `pointer-events: none`.
- Ornament border slicing:

```css
border-image-slice: 710 532 457 670;
border-image-width: 98.31px 90px 77.33px 90px;
border-image-repeat: stretch;
clip-path: inset(0 round 8px);
```

The asset URL is generated from `import.meta.env.BASE_URL`, so it remains valid on GitHub Pages.

## Data and files

- Atlas data: `public/data/atlas.json`.
- Vue island: `src/components/AtlasCategoryTabs.vue`.
- Atlas page shell: `src/pages/atlas/index.astro`.
- Shared styles and visual tokens: `src/styles/atlas.css`.
- Base layout, CDNs, background images, Lenis, and custom scrollbar: `src/layouts/BaseLayout.astro`.

## Change checklist

Before completing a visual change:

1. Re-read this document and keep the change scoped to the request.
2. Preserve the gold token system, 8px component radius, 1470px content width, and container-query layout unless explicitly superseded.
3. Preserve content/readability over the undimmed global background.
4. For interactive visual changes, retain button focus states and ensure decorative layers use `pointer-events: none`.
5. Update this document when the approved baseline changes.
6. Run `npm run build` after source changes.
