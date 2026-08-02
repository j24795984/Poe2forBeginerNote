# POE2 Beginner Note — Design Baseline

This document records the approved visual and interaction baseline for the current site. Read it in full before changing any page layout or UI styling. Update it whenever an approved change alters the baseline.

## Product and scope

- Static Astro site with Vue islands, deployed under the GitHub Pages base path `/Poe2forBeginerNote/`.
- The active reference page is `/atlas/`, a functional atlas guide with category navigation and dynamically swapped Vue content.
- The visual direction is a dark Path of Exile–inspired field guide: atmospheric world imagery, restrained dark utility UI, gold as the single functional accent, and ornate card corners.
- There is one dark colour mode only. Do not add a light/dark mode toggle.

## Design contracts

- Preserve route paths, category names, JSON data contracts, keyboard-accessible native buttons, and the existing GSAP/Lenis behaviour unless the user explicitly requests a change.
- Use Tailwind utility classes for layout and common styling; use `src/styles/style.css` for design tokens, pseudo-elements, container queries, reusable visual effects, and animations.
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
- The browser’s native scrollbar is hidden. `BaseLayout.astro` renders a fixed glass scrollbar that overlays the viewport and must not consume content width: its thumb is white at 30% opacity and its track uses a `10px` blur. Vue dispatches `site-content-resize` after atlas data/content changes so its thumb length is recalculated.
- Lenis is enabled globally from CDN for smooth scrolling. GSAP and ScrollTrigger are bundled from the local `gsap` dependency, registered by the shared site shell, and exposed through the existing `window.gsap` and `window.ScrollTrigger` interfaces so component motion and Lenis integration do not depend on a third-party animation script completing first.
- Programmatic viewport positioning must dispatch the shared `site-scroll-to` event instead of calling native `window.scrollTo()` directly. `BaseLayout.astro` routes this event through Lenis, preventing competing scroll controllers from making smooth navigation intermittent. Respect `prefers-reduced-motion` by requesting the event's non-smooth behaviour.

## Layout and responsive rules

- Global page containers use `div.global-px-box > div.base-container`. `.global-px-box` provides a full-width box with `20px` horizontal padding, growing to `32px` from the medium breakpoint; `.base-container` provides the centred `max-width: 1440px` content area. Use these shared CSS classes instead of repeating equivalent page-level utility strings. Future width/padding variants follow the same two-role naming pattern (for example, `global-large-px-box` and `full-container`).
- The atlas workspace is a named inline-size container: `atlas-content`.
- Below container width `42rem`, categories appear as a two-column grid above the detail content.
- From `42rem`, the workspace uses a two-column layout: a `13rem–15rem` left navigation and a fluid detail area. The navigation is sticky below the measured top-menu height, with an additional `1.5rem` gap; this preserves clearance when the fixed menu reappears during upward scrolling.
- Main workspace gap: `2rem`, growing to `clamp(2rem, 4cqw, 4rem)` at the container query.
- Navigation item gap: `12px`.
- Detail cards use `28px` separation, increasing to `32px` from the medium breakpoint.

## Typography and hierarchy

- English body/utility font: `Ramabhadra`; English decorative font: `Lobster Two` (regular and bold). Chinese content uses `Noto Sans TC`, with the full variable `100–900` weight range loaded for future type adjustments.
- Use `.font-english-body` for English UI/content and `.font-english-decorative` for English decorative labels. The top menu—including its brand—uses the body font; `ATLAS INTEL` uses the decorative font. Chinese glyphs fall back to `Noto Sans TC`.
- Generic interface icons may use Google `Material Symbols Outlined` (default `24px`). Use its icon-name ligatures (for example, `menu` or `settings`) and provide an accessible label when an icon is not purely decorative.
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

- `--atlas-yellow` is the standard functional gold for headings, links, borders, and numbered content.
- `--atlas-yellow-bright` is reserved for stronger labels such as `ATLAS INTEL`.
- Avoid introducing amber utilities or unrelated accent hues. Warm orange-red is permitted only inside the selected category’s metallic gradient to create non-black shadow depth.

## Shared top menu

- `TopMenu.astro` is rendered by `BaseLayout.astro`, so each page receives the same navigation.
- `POE2 BEGINNER NOTE` is the only home link and points to the GitHub Pages base path.
- The brand link includes `public/images/logo.webp` as a decorative `48px × 48px` image before the text, reducing to `32px × 32px` below `768px`.
- On desktop, the primary guide links appear to the right of the brand. `工具` and `設定` are available from the right-aligned hamburger menu.
- On screens below `768px`, all navigation links move into the hamburger menu.
- The menu uses a deliberate glass shell: deep blue-black translucent surfaces, the same `rgb(245 245 244 / .15)` border as atlas content cards, and a `99999px` outer radius. It uses a `10px` blur with 118% saturation. This is the approved exception to the no-`backdrop-filter` card rule; `backdrop-filter` is limited to the top menu shell, dropdown, and scrollbar track.
- Top-menu link hover and open-menu states never use a visible border, text-colour change, or positional shift. A subtly textured frosted surface fades in over `280ms`, from dark upper-left to a contained right-lower light area on a `160deg` axis; it uses a low-contrast diagonal grain and `4px` local blur. The inset shadows are light on the upper-left and deep on the lower-right, while two subtle dark outer shadows contain the recess. The text receives a pronounced right-lower shadow.
- The top menu is fixed and keeps an equal-height layout spacer. A native passive scroll listener tracks scroll distance independently of external CDN scripts: after a `12px` same-direction threshold, downward scrolling increases its negative Y transform and upward scrolling reduces it. The value is clamped from `0` to the menu’s measured height, so it cannot move farther than the menu itself. Rendering is coalesced to animation frames and interpolates 24% toward its target on each frame; do not restore timer-based polling.
- The top menu does not use the atlas content entrance animation, so its functional scroll transform cannot conflict with page animation transforms.
- Selecting an atlas category scrolls the viewport to the top, using smooth scrolling unless the user prefers reduced motion.
- Atlas categories use copyable hash routes (for example, `/atlas/#league-mechanics`) without a document navigation. A click creates a browser-history entry; opening a category URL and browser back/forward restore the matching category.
- The league-mechanics section uses one horizontal quick-navigation row. It can scroll horizontally on narrow screens; selecting a mechanism smoothly positions its sequential content block below the fixed top menu, unless the user prefers reduced motion.
- Quick-navigation rows use the generic `.content-quick-nav` component classes. They can scroll horizontally on narrow screens; at the `42rem` container breakpoint they become sticky at `--top-menu-height + 1.5rem`, matching the left category navigation. Sticky rows use the card's deep black-to-blue treatment and a containment shadow so adjacent content cannot show through. The league-mechanics card is the exception: its quick navigation remains fixed within the card while ScrollTrigger uses the card as the trigger, pins the complete right-side `.atlas-detail` stage at the left category navigation's top edge, and maps page scroll to the clipped (`overflow: hidden`) mechanics list. Earlier sibling content therefore keeps its current viewport position until the inner list reaches its end; the complete stage then resumes page scrolling together. Any later nested overflow sequence on this page must reuse the same trigger/stage/viewport/track helper pattern instead of pinning only its own card. This desktop interaction is disabled for reduced-motion users and when no content overflows. The builds campaign card contains its quick navigation, `核心防禦機制`, and `裝備詞綴選擇【泛用】` as three sequential areas.
- Keep the gold tokens for hover and keyboard focus; do not use the reference image’s orange-red palette.

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
background: linear-gradient(100deg, rgb(0 0 0 / .6) 20%, rgb(11 57 163 / 20%));
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

- Atlas data uses three related JSON layers with a shared `dataVersion`: `public/data/atlas-entities.json` stores canonical sources, items, bosses, locations, mechanics, map states, and biomes; `public/data/atlas-relations.json` stores typed links between those entity IDs; `public/data/atlas.json` remains the presentation layer and exposes `referenceViews` that select entity and relation IDs for future UI sections. Its existing `atlas.categories` and `leagueMechanics` fields remain available during the renderer migration.
- Campaign data uses three related JSON layers with a shared `dataVersion`: `public/data/campaign-entities.json` stores canonical sources, chapters, chapter segments, map surfaces and points, quests, and permanent rewards; `public/data/campaign-relations.json` links chapters to maps, quests, reward segments, reward entries, and confirmed map-point locations; `public/data/campaign.json` remains the presentation layer for the five fixed chapter categories (`第一章` through `第四章`, plus `間歇`) and exposes `referenceViews`. The Astro page rebuilds the existing reward-card input from the entity document at build time, so the Vue island keeps its current rendering contract. Third chapter still exposes four map states: present surface, present underground, past surface, and past underground.
- Campaign Vue island: `src/components/CampaignChapterTabs.vue`. Campaign uses an independent layout with a compact, horizontally scrollable chapter navigation; each tab presents the decorative English label above the Chinese chapter name. The chapter scrollbar remains visually hidden while touch, trackpad, and pointer scrolling stay available. The chapter navigation and compact map controls share one interruptible `748ms` Web Animations underline interaction generated from a continuous sampled curve. Position and width change together throughout the move, then the line contracts by `4.5%` near its destination and returns to normal with a decaying rebound. Extension follows `8% + movement units × 9%`. Every animation converges on that absolute width instead of adding extension to the currently rendered width, preventing repeated hover interruptions from accumulating line length. The underline sits inside the clipping boundary so it remains fully visible. The route-map stage uses `padding-top: calc(48 / 19.2 * 1vw)` and permits visible overflow. Inside it, `.campaign-map-image-container` owns the source images' `2624 / 1632` aspect ratio; its compact map-state controls are overlaid at the map's top-left corner, and a right-aligned permanent-reward card list overlays the map at desktop widths. The desktop reward list uses `min(20rem, 30.4%)`, equal to 80% of its previous width; the map pan padding and toggle alignment derive from this same width token. The list has no enclosing surface or heading and can be shown or hidden with a dedicated bright native button aligned with the first card. Reward cards omit sequence numbers and use compact spacing: each starts with the acquisition method and a highlighted concrete target (including the actual boss name), with the map name shown beside it as a fit-content tinted label; the acquisition condition occupies the full card width beneath that row so concise instructions remain on one line. Straightforward boss rewards use the concise instruction `擊敗 XXX。`, while required event prerequisites remain explicit. The reward label and value share one horizontal row below. Cards whose locations have confirmed coordinates expose a native full-card positioning button. Selecting one searches all map surfaces in the active chapter, automatically switches to the owning surface when necessary, then draws a gold pulse over the corresponding map point and smoothly pans the internal horizontal viewport to place that point near the centre of the unobscured map area; repeated selection recentres it, and reduced-motion preferences make the movement immediate. Cards without confirmed coordinates remain non-interactive. The reward list is an independent native vertical scroll region when its content overflows; wheel input over the list bypasses the page-level Lenis smoothing, and scroll chaining is contained at its boundaries. While the list is open, the map's internal pan canvas receives right padding equal to the list width; that padding region is covered by 50% black, the image retains its original rendered size, and mouse drag or native touch scrolling can reveal the area normally covered by the cards. Map position and selected point reset when switching map surfaces or chapters. Below `1024px`, the card list moves into the map frame beneath the image and the extra pan padding is removed. The separate reward section below the map is not rendered. A sibling `.campaign-map-border-box` also permits overflow and uses `public/images/ui_img/img/border-2-body.webp` with `border-image-slice: 300 200`; its previous visual widths are doubled responsively to `calc(96 / 19.2 * 1vw)` and `calc(64 / 19.2 * 1vw)`. It keeps `top: 0`, extends `6px` beyond both horizontal edges, and extends `15px` below the stage. The asset URL is generated from `import.meta.env.BASE_URL`. Its native map-state controls use a quiet, unsegmented surface without hover or selected background changes.
- Campaign chapter toolbar: its chapter navigation and right-aligned, content-height action group align to the toolbar's bottom edge. `任務總覽` opens the PoE2DB quest overview in a new tab, while `章節流程推薦` reads the active chapter's `quickGuideUrl` and switches automatically with chapter selection. Neither action stretches to the chapter navigation's full height. The chapter navigation keeps the remaining toolbar width and remains horizontally scrollable on narrow screens.
- Campaign reward-card heading: the acquisition label and fit-content map labels share the first row. The highlighted target/title receives its own full-width row and wraps only when the full card width is exhausted; the acquisition condition remains full width beneath it.
- Campaign task cards may omit the reward row when an informational or collection task has no permanent reward.
- Campaign source footer: source records retain their detailed article URLs for traceability, but the rendered footer deduplicates them by publisher and shows only each publisher's main website homepage (`PoE2DB`, `Mobalytics`, and `巴哈姆特`).
- Every campaign task card ends with a compact, bottom-right `詳細內容` button. The button uses a fully opaque yellow fill, dark text, and square corners. It is a reserved interaction surface only; no modal or lightbox behavior is attached until that feature is designed.
- Campaign reward-card interaction states: on desktop devices with precise hover input, hovering an interactive positioning card uses the same gold border and containment glow as its selected state. Touch layouts remain selection-driven and do not depend on hover feedback.
- Campaign map-point hover: on desktop devices with precise hover input, hovering a confirmed map point reveals a compact gold ring, glow, and pulse over that point while highlighting every permanent-reward card whose location matches it. Click positioning uses the same compact visual language: its selected hotspot is `2.5rem` on desktop and `2.25rem` below `768px`, with a proportionally contained glow and pulse. The visible ring is smaller than its transparent hit area so the waypoint remains easy to target without obscuring adjacent map details. Multiple cards at the same location highlight together. A selected reward-card positioning state takes priority and temporarily disables every map-point hover target, so click selection and hover highlighting never appear simultaneously on one map. The hover target is invisible at rest and uses the same normalized coordinates as click positioning; it is disabled below `768px` and on non-hover input.
- Campaign multi-map rewards: a reward may expose multiple related map labels. Hovering any related confirmed point highlights the shared card; selecting that card draws simultaneous gold pulses over every related point on the active map surface and horizontally centres their combined range.
- Campaign Abyss reward: the `無光通道` reward card uses a dedicated black-to-deep-green gradient to distinguish Abyss crafting while retaining the shared card structure, gold interaction states, and responsive sizing.
- Campaign mobile override: below `768px`, the map container keeps the available content width and uses exactly `90lvh` height. Its bottom `clamp(9.5rem, 17lvh, 10.5rem)` is a fixed, non-scrolling reward reserve; the map viewport uses the remaining height, slightly reducing the rendered image while retaining its `2624 / 1632` ratio. Horizontal image overflow is revealed through native touch scrolling or pointer dragging. The map controls sit `.75rem` from both the top and left edges. The map-name caption is not rendered at any breakpoint. The always-visible reward panel is bottom-aligned inside the reserve and presents one horizontal, scroll-snapping card rail whose cards use a fixed `280px` width with a partial next card visible; it never overlays the map and has no mobile collapse control. Card selection still switches surfaces, highlights the normalized map point, and horizontally recentres it using the rendered figure width. Map-point hover linking is not active on mobile. From `768px` through `1023px`, the existing below-map list layout remains in effect.
- Campaign page shell: `src/pages/campaign/index.astro`.
- Vue island: `src/components/AtlasCategoryTabs.vue`.
- Shared top menu: `src/components/TopMenu.astro`, rendered by `src/layouts/BaseLayout.astro` on every page.
- Atlas page shell: `src/pages/atlas/index.astro`.
- Shared styles and visual tokens: `src/styles/style.css`.
- Base layout, CDNs, background images, Lenis, and custom scrollbar: `src/layouts/BaseLayout.astro`.
- Production build assets use `dist/js/` (including `dist/js/chunks/`) and `dist/css/`. Do not use Astro's default `_astro/` output directory; this keeps assets compatible with GitHub Pages' default Jekyll processing.

## Change checklist

## Homepage

- Route: `/`; the homepage is intentionally a minimal placeholder hero with the H1 `還沒想到要放什麼就先放一隻兔子` and the user-provided transparent rabbit asset at `public/images/rabbit-background-removed.png`.
- The hero uses a wide editorial split on desktop, placing the headline beside the rabbit, and becomes a centred vertical stack below `768px`. It remains directly over the shared undimmed world background without an additional card surface.
- The rabbit asset URL is generated from `import.meta.env.BASE_URL` so it remains valid on GitHub Pages.

## Crafting page

- Route: `/crafting/`; the existing shared top-menu entry labelled `做裝` links to it.
- The page separates equipment evaluation from procedural crafting. `public/data/crafting-progression.json` defines the canonical G0–G5 growth curve, while `public/data/crafting-methods.json` relates practical methods and advanced flows back to those stages through `stageIds` and `stageId`. Both files share one `dataVersion`, are loaded during the Astro build, and are passed as initial props to `CraftingGuide.vue` so the first usable category is present in static HTML.
- The category navigation follows the campaign chapter-tab pattern and contains two editorial categories, `裝備製作通則` and `製作流程與資金管理`. The first consolidated method category is `基礎做裝`, sourced from `methodGroups` in `crafting-methods.json`; it combines the former `基礎加工` and `精髓製作` top-level entries while the remaining advanced method categories stay unchanged until their own consolidation pass. It uses the same fit-content width, fixed-width tabs, compact English-over-Chinese labels, horizontally scrollable narrow-screen treatment, and gold active indicator; it must not stretch across the content width. `#basic-crafting` is the canonical basic-crafting hash, while legacy `#basic-magic` and `#essence` hashes are replaced with it during initialization. Category changes retain the shared GSAP transition through `useCategoryTabs`.
- `裝備製作通則` is a five-stage editorial guide centred on how much compromise is acceptable: campaign, early Atlas, mid Atlas, late Atlas, and graduation gear. It explains bases, effective modifiers, Tier expectations, and crafting direction in one numbered reading flow, then closes with a semantic three-column comparison table and a scope note. Emphasised phrases are represented as structured rich-text parts in JSON rather than embedded HTML. The canonical G0–G5 records remain in `crafting-progression.json` as relational metadata for method applicability and method-page stage tags, but are not rendered as the first-page content.
- `製作流程與資金管理` uses three numbered sections in this order: a five-stage investment/stop-condition comparison, concise resource-investment principles, and a paged crafting-resource list. The page-level intel heading is the sole title; the main card must not repeat either the Chinese title or an English eyebrow. Both comparison regions use ARIA table roles with CSS Grid rows and `subgrid` column alignment generated from structured JSON. Text is intentionally larger than the prior table treatment. The third section provides five native stage tabs (`章節`, `輿圖初期`, `輿圖中期`, `輿圖後期`, `畢業裝`) and displays only four columns: crafting method, selected-stage usage, recommended investment condition, and discouraged investment condition. Every method owns separate recommended and discouraged guidance for all five stages. The selected tab responds immediately, while the complete four-column grid exits with a short opacity and upward movement, swaps to the requested stage after the exit, then fades and rises into place; interrupted selections cancel the active Web Animation and converge on the latest selection. Reduced-motion users receive an immediate content swap. Desktop keeps these four columns visible, while phone containers replace the header row with labelled single-column record cards. Resource principles use four columns on desktop, two on tablet, and one on phone. Cells whose usage contains `不建議` or `不使用` use a subdued text tone. The resource list includes `骸骨（深淵）`, separating broken, preserved, ancient, and altered bone guidance by progress band and item restriction; its names and restrictions are sourced from the PoE2DB Abyss reference.
- `基礎做裝` focuses on practical currency-clicking decisions. Its first card explains the shared rule of reassessing value after every added modifier and provides three starting paths: a cheap white base, a dropped magic item with a retainable core modifier, or an Essence-directed core modifier. Separate full-width cards then preserve the canonical `白底／藍底基礎加工` and `精髓定向製作` records, each showing applicable stages, start conditions, actual currencies, ordered clicking steps, completion target, and stop condition. The decision list is three columns on wide containers and one column below `56rem`. Other crafting-method categories retain the same full-width detail structure. Cost remains qualitative (`極低` through `極高／奢侈`) and never writes volatile currency prices into the rules; the Taiwan-realm Economy page remains the lookup entry point.
- The original G4 endgame and G5 high-budget flows remain available as `進階完整流程` under `分側製作`, because both combine prefix/suffix side control with fracture, directed additions, and final processing. The high-budget flow retains fracture outcome branches, a normal-sized core rule, an explicit minimum-funds warning, maximum-budget reminders, and a preflight checklist. Corruption remains the final optional operation.
- Crafting visuals preserve the existing dark-to-blue card treatment, single gold accent, 8px radius, shared ornament, responsive container layout, keyboard focus states, and top-menu behavior. The dense instructional content uses a full-width stage rail and ordered timelines instead of decorative bento layouts.

## Valuable items page

- Route: `/valuable-items/`; the shared top-menu entry labelled `高價值物品` links to it.
- `public/data/special-high-value-drops.json` supplies the build-time `特殊高價掉落` table. Its current phase contains curated rare currency plus high-value fragments and entry tickets; common general currency is excluded, and unique equipment is deferred to a separate later pass. Fragment and ticket records share one `碎片／門票` category, with the initial price threshold set at approximately `1 D` on the Taiwan realm.
- The table preserves six fields for item name, type, drop area, related boss, approximate Taiwan-realm value, and acquisition method. `acquisition.summary` supplies every row's concise method and defaults to `隨機掉落` for unrestricted drops. Only annotated items may add `acquisition.detail`, containing a title, optional navigation entries, and trusted repository-authored HTML. Those rows expose a compact More/`詳細` button that opens a native modal dialog; the dialog is centred in the viewport and its panel uses GSAP to rise `18px` into place while fading in over `.38s`, unless reduced motion is requested. While the dialog is open, document scrolling and scroll chaining are locked, Lenis ignores the modal, and the detail-content region remains an independent vertical touch/wheel scroll container for long explanations. This region uses a narrow gold custom scrollbar and larger `1.02rem` section headings with `.95rem` body copy. Optional detail navigation renders at the top of this same scroll container, follows the content naturally rather than sticking, and smoothly positions the container at trusted target IDs; every target group begins with a prominent `1.4rem` white heading and gold left rule. The Fracturing Orb detail groups its level-75 high-tier atlas passives under `前置條件`: `隱蔽傷痕` and `遙聲未語` are identified as direct Fracturing Orb sources, while `額外已淨化怪物群`, `腐化解脫`, and `已淨化地圖中的聖潔魂靈機率` are separately identified as Cleansed-area enhancements. All remaining guidance stays under `掉落區域`, and official PoE2DB names plus the `已淨化特殊詞綴` reference remain inline external links. On close, the panel fades while moving down `12px` over `.28s`, synchronized with the black backdrop's fade from 30% opacity; the native close call is deferred until both exit animations complete and page scrolling is restored by the dialog's close event. It supports Escape, keyboard focus, backdrop dismissal, and a visible close control. Types are defined in data as `通貨`, `碎片／門票`, `傳奇`, and `限定傳奇`; types without current records remain visible but disabled in the filter. Unknown or non-specific drop areas and bosses are shown as `無`.
- A search input and multi-select type tags sit below the introductory copy. Their shared filter container has no background or border; the input and tags retain their own interactive surfaces. An empty type selection means all available records; filter tags do not display item counts. The result count and clear-filter action update without replacing the server-rendered initial list.
- Desktop uses one six-column grid. The high-value-items panel increases the shared content-card gradient opacity by 10 percentage points (`.6` to `.7` for black and `20%` to `30%` for blue). Data-row cells remain transparent so the unified panel surface shows through; only the column-heading row retains its dedicated dark background. Below `900px`, each item becomes a labelled two-column card grid; below `640px`, cards become a single column.
- Item names link to their corresponding PoE2DB pages. The upper summary area links to `https://poe2db.tw/tw/Economy` as `台服通貨交易價格`, with a small note that it includes fragments, tickets, gems, and other item types. The page clearly states that Taiwan-realm prices may differ from international realms.

Before completing a visual change:

1. Re-read this document and keep the change scoped to the request.
2. Preserve the gold token system, 8px component radius, 1470px content width, and container-query layout unless explicitly superseded.
3. Preserve content/readability over the undimmed global background.
4. For interactive visual changes, retain button focus states and ensure decorative layers use `pointer-events: none`.
5. Update this document when the approved baseline changes.
6. For any programmatic scroll interaction, verify it in Chrome after scrolling down: test both changing to another item and clicking the currently selected item again. Both must reach their intended position reliably; smooth motion must defer to the user's reduced-motion preference.
7. Run `npm run build` after source changes.
