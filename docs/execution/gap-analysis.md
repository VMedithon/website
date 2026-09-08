# Gaps observed in this checkout

- **GAP-DOC-01 — Event facts conflict.** AGENTS.md describes September 21–22 at VIT Vellore, lasting 36 hours. The existing marketing content describes September 15–16 at VIT Chennai, lasting 24 hours. The design change preserves the existing marketing facts pending organizer confirmation.
- **GAP-VERIFY-01 — Verification infrastructure missing.** AGENTS.md references `scripts/verify`, tests, and CI, but this checkout has none of them. The available typecheck, lint, and build commands are used for this PR; automated browser coverage remains a gap.
- **GAP-DOC-02 — Platform documentation absent.** The normative documents and docs/INDEX.md referenced by AGENTS.md are absent. The current-state ledger added here is limited to observable marketing behavior.
