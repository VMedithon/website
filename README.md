# VMEDITHON 2026

Website and event platform for **VMEDITHON 2026** — a 36-hour overnight hackathon at
VIT Vellore, September 21–22, 2026. "Ideas, engineered for impact."

The event routes every team into one of three outcome tracks:

- **Research** — leave with a publication-ready paper
- **Industry** — build a working prototype against a real problem statement
- **Project** — produce a patent-ready design

## Repository status

The public landing site and worker API are implemented. The "Control Room"
dashboard at `/platform` is still a **frontend design preview** — its data is
hardcoded and not yet wired to the backend. Public certificate verification is
live at `/verify`. See [`docs/execution/current-state.md`](docs/execution/current-state.md)
for what exists and [`docs/INDEX.md`](docs/INDEX.md) for the full documentation map.

## Quick start

```bash
bun install
bun run dev          # Vite dev server
bun run typecheck    # type check app + worker
bun run lint         # Biome lint
bun run test         # vitest
bun run build        # production build → dist/
./scripts/verify     # full verification: typecheck, lint, tests, build, wrangler types
```

## Stack

- **Frontend**: Vite + React 19 + TypeScript, lucide-react icons, plain CSS
- **Target platform**: Cloudflare Workers (static assets + API Worker), D1, R2,
  Queues; Clerk for authentication and staff invitations — see
  [`docs/architecture/decisions/0001-cloudflare-clerk-monorepo.md`](docs/architecture/decisions/0001-cloudflare-clerk-monorepo.md)

## Documentation

- Agent entry point: [`AGENTS.md`](AGENTS.md)
- Documentation router: [`docs/INDEX.md`](docs/INDEX.md)
- Product spec: [`docs/product/product-spec.md`](docs/product/product-spec.md)

## License

See [LICENSE](LICENSE).
