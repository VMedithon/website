# Current state — marketing design

This ledger covers the marketing checkout only. The broader platform documents referenced by AGENTS.md are not present on this branch; this file does not assert their implementation status.

- The public landing page uses an editorial layout with charcoal/cream surfaces, lime/peach accents, responsive track comparisons, themed panels, an ordered participant journey, rounds, prizes, downloads, partners, FAQs, and contact details.
- The hero renders a procedural Canvas 2D signal sculpture with pointer response and an explicit pause control. Animation stops outside the viewport, in hidden tabs, and when reduced motion is requested. The reduced-motion presentation retains all text and calls to action.
- The former fixed Three.js scenes are not mounted by the landing page. Their source assets remain in the repository.
- Light/dark theme selection, mobile navigation, Devnovate registration, and the existing resource downloads remain available. Partner logos use a static responsive layout.
- Event facts remain those already published in this checkout: September 15–16, 24 hours, VIT Chennai. These conflict with the event summary in AGENTS.md and need organizer confirmation before any content change.
- Available validation commands are `bun run typecheck`, `bun run lint`, and `bun run build`. This checkout has no `scripts/verify`, test script, or CI workflow. Lint reports five existing non-null assertion warnings in the unmounted `DnaScene.tsx`.
