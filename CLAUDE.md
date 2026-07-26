## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Design baseline

Before changing any page layout or UI visual style, read [`design.md`](design.md) in full. Treat it as the current approved design baseline, preserve its documented contracts unless the user explicitly changes them, and update it when an approved visual or interaction change alters that baseline.

## Frontend design skills

Project-local design skills are installed under `.agents/skills/` and should be read in full before they are applied:

- `web-design-engineer` — used for visual frontend work, redesigns, design-system decisions, UI critique, and browser acceptance/QA.
- `gpt-taste` — used for high-fidelity, motion-rich UI implementation. Apply its anti-generic-layout and accessibility checks when it does not conflict with the existing product design system or project constraints.
- `gsap-core`, `gsap-frameworks`, `gsap-performance`, `gsap-plugins`, `gsap-react`, `gsap-scrolltrigger`, `gsap-timeline`, and `gsap-utils` — use the relevant GSAP skill for animation implementation, framework integration, plugins, timelines, ScrollTrigger, utilities, or performance work.
- `design-reference-library` — use to select one bundled DESIGN.md reference before a substantial visual design or redesign; adapt principles rather than copying a brand identity.
- `karpathy-guidelines` — use for non-trivial coding work to keep scope explicit, solutions simple, edits surgical, and success criteria verifiable.
- `build-and-push` — use only when the user explicitly requests updating the website or GitHub Pages; it publishes compiled files from `creating-web` to `main`.

For a substantial visual frontend task, load `web-design-engineer` first to establish the product context and design direction, then `design-reference-library` if a reference style is useful, then `gpt-taste` for implementation detail. Load only the GSAP skills needed for the requested animation. Do not load visual design skills for non-visual backend, data-processing, or pure-logic tasks.

## Skill initialization and availability

At the start of a task, before relying on a project skill, check both `.agents/skills/<skill-name>/SKILL.md` and the global Codex skill directory (`$CODEX_HOME/skills/<skill-name>/SKILL.md`, or `~/.codex/skills/<skill-name>/SKILL.md` when `CODEX_HOME` is unset). Prefer the project-local version when both exist.

If a required skill is absent from both locations, install it under `.agents/skills/` in this repository only. Never install a missing project skill globally. Record any newly added project skill in the Frontend design skills list above.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
