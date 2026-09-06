# Gap Analysis — current vs desired

> Records meaningful discrepancies between observed reality and the requested
> state. Update as the project evolves.

| ID | Area | Current state | Desired state | Risk if unaddressed | Resolution |
|---|---|---|---|---|---|
| GAP-BACKEND-01 | Backend removal | Backend worker removed intentionally | No backend desired | N/A — intentional scope | N/A |
| GAP-CONFIRM-01 | Event details | Many public details marked 'TBA' or 'pending confirmation' | Confirmed event facts published | Participants may lack clarity | OC to confirm and update `src/data.ts` |
| GAP-UI-01 | Visual QA | No automated visual QA run | Lighthouse + reference-fidelity QA | Regressions in layout/theme | Run visual QA when a browser is available |
| GAP-DASH-01 | Submission wiring | Dashboard is localStorage-only only | Real submission portal | Participants cannot actually submit Round 1 | Re-introduce backend only if scope changes |

## Closed

All previous backend/auth/data/dashboard gaps are obsolete after the frontend-only
rebuild.
