# DESIGN.md — VMEDITHON 2026

Design contract for the platform UI. Every color, radius, and shadow traces to a
token here. Aesthetic target: **Apple × health-tech** — calm neutral canvases,
glassy translucent chrome, generous whitespace, capsule CTAs, and a single vivid
clinical accent family drawn from the logo.

## 0. Research Log

- **Layer A style skill:** `soft-skill.md` — premium, glossy, glassy surfaces;
  capsule buttons, double-bezel cards, spring-eased motion. Chosen because the
  brief asks for "sexy / premium" (not brutalist or minimal-flat).
- **Layer B brand:** `apple.md` — the named reference. Supplies the neutral
  triad, restrained depth (surface stepping over heavy shadow), capsule radius
  language, and the "chrome disappears so content leads" posture.
- **Palette source:** extracted from `src/assets/logo.png` — green V `#08E89B`,
  gold caduceus `#FCC505`, blue O `#1884EF`, white `#FCFCFC`.
- **Skipped lanes:** lazyweb/stylegallery/imagen — an existing implemented UI is
  being re-themed, not greenfield; the logo + Apple reference are the contract.

## 1. Color — semantic tokens, two modes

Themes switch via `data-theme="light"|"dark"` on `<html>`. All components read
semantic tokens, never raw hex.

### Brand accents (constant across modes)
| Token | Value | Use |
|---|---|---|
| `--brand-green` | `#0CE281` | primary accent, mint family (logo V) |
| `--brand-green-deep` | `#06b96e` | hover/pressed, light-mode text accent |
| `--brand-gold` | `#FCC505` | highlight, dates, caduceus accent |
| `--brand-blue` | `#1884EF` | links, info, logo O |
| `--brand-ink` | `#0B1F19` | deep clinical green-black (dark surfaces) |

### Light mode (`:root`)
| Token | Value | Role |
|---|---|---|
| `--bg` | `#f5f6f4` | page canvas (pale neutral, Apple `#f5f5f7` warmed slightly) |
| `--bg-elev` | `#ffffff` | cards, panels, popovers |
| `--bg-subtle` | `#eceee9` | recessed wells, code/track fills |
| `--ink` | `#0b1f19` | primary text (clinical near-black, not pure black) |
| `--ink-2` | `#46564f` | secondary text |
| `--ink-3` | `#7d8b84` | tertiary/meta text |
| `--line` | `#d9ded8` | hairline borders |
| `--line-strong`| `#c2c9c1` | field outlines |
| `--accent` | `#06b96e` | primary action fill (deep enough to read on white) |
| `--accent-ink` | `#ffffff` | text on accent |
| `--accent-soft`| `#d8f5e8` | accent-tinted chips/surfaces |
| `--on-accent` | `#0b1f19` | text on bright mint fills |

### Dark mode (`[data-theme="dark"]`)
| Token | Value | Role |
|---|---|---|
| `--bg` | `#0a1410` | page canvas — deep clinical green-black |
| `--bg-elev` | `#101d17` | cards/panels — stepped up from canvas |
| `--bg-subtle` | `#0d1813` | recessed wells |
| `--ink` | `#eef4f0` | primary text |
| `--ink-2` | `#a9bcb2` | secondary |
| `--ink-3` | `#748b80` | tertiary/meta |
| `--line` | `#1f2f28` | hairlines |
| `--line-strong`| `#2c4036` | field outlines |
| `--accent` | `#0ce281` | primary action fill (bright mint pops on dark) |
| `--accent-ink` | `#06251a` | text on accent |
| `--accent-soft`| `#0f2f24` | accent-tinted surfaces |
| `--on-accent` | `#06251a` | text on bright mint |

### Status / semantic (both modes, tuned per mode)
- success → green family; warning → `--brand-gold`; info/link → `--brand-blue`;
  danger → `#e5484d` (light) / `#ff6b6b` (dark).

## 2. Typography

Keep the existing stack — it already reads editorial + technical:
- **Display:** `Syne` 700/800 — hero + section heads, tight `-0.02em` tracking.
- **Body/UI:** `Manrope` 400–700.
- **Mono/labels:** `DM Mono` 500 — kickers, eyebrows, meta (uppercase, `+0.14em`).

Scale is unchanged; only color tokens move.

## 3. Shape & depth

| Token | Value | Use |
|---|---|---|
| `--r-pill` | `999px` | buttons, chips, toggles, nav pill |
| `--r-card` | `20px` | cards, panels, modals |
| `--r-inner` | `14px` | nested cores inside cards |
| `--r-field`| `12px` | inputs, selects |
| `--shadow-1`| `0 1px 2px rgba(11,31,25,.05), 0 4px 16px rgba(11,31,25,.06)` | resting card |
| `--shadow-2`| `0 8px 30px rgba(11,31,25,.12)` | hover/elevated (light) |
| `--shadow-2-dark`| `0 8px 30px rgba(0,0,0,.5)` | hover/elevated (dark) |
| `--glass` | `backdrop-filter: blur(20px) saturate(160%)` | nav, overlays, sticky chrome |

Depth is restrained — tonal surface stepping + hairlines, soft diffused shadow
only on elevation. No heavy drop shadows, no glow spam.

## 4. Signature treatments

- **Nav:** floating glass pill — `position:fixed; margin:16px auto; border-radius:999px; background:color-mix(in srgb, var(--bg-elev) 72%, transparent); backdrop-filter:var(--glass); border:1px solid var(--line)`.
- **Hero:** full-bleed canvas in the mode's `--bg`, oversized Syne headline, logo
  wordmark, a soft radial brand glow (green→blue at ~8% alpha) behind the copy.
- **Cards:** "double-bezel" — outer shell `var(--bg-elev)` + `1px var(--line)` +
  `--r-card` + `--shadow-1`; inner elements use `--r-inner`.
- **Track layout:** asymmetric bento grid — first two cards at `1.25fr / .75fr`,
  third card spans full width as a horizontal feature. Breaks the generic 3-equal
  column pattern and gives the last track more presence.
- **Buttons:** capsule (`--r-pill`). Primary = `--accent` fill / `--accent-ink`
  text; ghost = transparent + `--line-strong` border. Trailing icon in a nested
  circle. Press = `scale(.97)`.
- **Motion:** `cubic-bezier(.32,.72,0,1)` ~500–700ms; transform/opacity only;
  `prefers-reduced-motion` disables. Scroll-driven reveal uses `IntersectionObserver`
  to add a `.reveal-visible` class (`translateY(28px) → 0`, `opacity 0 → 1`,
  750ms) with 90ms stagger delays per item.

## 5. Theme plumbing

- `index.html` inline script sets `data-theme` before paint: `localStorage.theme`
  else `prefers-color-scheme`. Prevents flash.
- `useTheme()` hook reads/writes `document.documentElement.dataset.theme` +
  `localStorage`. Toggle (Sun/Moon lucide) in nav + dashboard topbar.
- `theme-color` meta updated per mode.

## 6. Accessibility & debt

- Accent text on `--accent` meets contrast in both modes (deep green on light,
  near-black on bright mint in dark).
- Focus ring: `2px var(--brand-blue)` offset — visible on both canvases.
- Dark-mode images/logo: wordmark already has dark (`logo-dark.png`) and light
  variants; swap per theme.
- **Accepted debt:** certificate preview keeps its parchment look in both modes
  (it's a document, not UI chrome).
