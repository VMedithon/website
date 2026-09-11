# VMEDITHON 2026

Public event website and participant, organizer, and judging dashboards. The existing landing page remains at `/`. `/schedule` shows the published event timeline and `/results` shows released standings.

## Development

Use Bun 1.3.14 or newer:

```sh
bun install --frozen-lockfile
cp .env.example .env
bun run dev
```

Configure two public build variables in `.env`:

| Variable | Value |
| --- | --- |
| `VITE_CLERK_PUBLISHABLE_KEY` | The event's Clerk publishable key |
| `VITE_API_BASE_URL` | The event API origin, such as `http://localhost:8787` locally |

Use matching development or production environments for both values. Never add secret keys, credentials, or private event records to this repository or to `VITE_` variables. Without the required configuration, portal pages show an availability message.

Sign-in and sign-up use Clerk. `/dashboard`, `/admin`, and `/judge` resolve to the signed-in person's permitted workspace. Participants can see their team, targeted announcements and forms, timeline, and released results. Organizers have tools for CSV rosters, announcements, forms and response tables, finances, judge access, scoring, results, and delegated access according to their permissions.

## Verification

```sh
bun run typecheck
bun run lint
bun run build
bunx playwright install chromium
bun run test
```

Browser tests exercise participant submissions, the form builder, CSV import, receipt entry/export, judge scoring, restricted navigation, result publication, and mobile/tablet layouts. They simulate sign-in and API responses through `vite.test.config.ts`. This test configuration is never used in the production build. Live Clerk sign-in and the configured event API require a separate deployment smoke check.

The original landing page currently has five existing non-null-assertion lint warnings in `DnaScene.tsx`; new portal code introduces no lint warnings.

## Contributions and publishing

Always open a pull request. The existing Cloudflare bot handles website CI/CD. Do not deploy the website manually or replace its hosting configuration. Configure the two public variables above in the existing build environment when activating the portals. Keep implementation details and operational instructions for private services outside this public repository.
