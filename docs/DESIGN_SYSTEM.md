# Design System — Bayand

This document captures the color palette, theming strategy, and visual design constraints for Bayand. Its purpose is to prevent design drift across the app, website, and any future contributions.

The document is structured in two layers:
1. **Design language** — implementation-agnostic: palette, intent, and decisions.
2. **Implementation** — how the design language maps to CSS variables, utility classes, and files.

----

## 1. Design Language

### 1.1 Logo

The Bayand logo is an abstract “habit rings” symbol plus a wordmark. It must read as “health and everyday wellness” without medical or hardcore gym connotations.

Symbol:
- A central filled circle (the user) with 2–3 concentric, rounded rings around it.
- One segment of the outer ring uses the brand teal accent; all other segments use a neutral (black/near-black or white/light neutral, depending on context).
- Rings are smooth and circular, with rounded ends and no sharp angles, evoking cycles, routine, and long-term balance.
- The silhouette must remain clear and recognisable at 24×24 px and in pure monochrome.

Wordmark:
- The word “Bayand” uses the same system UI font stack as the app to preserve offline/privacy characteristics and avoid extra font loading.
- Default lockup: symbol to the left of the wordmark, horizontally aligned.
- In constrained spaces (app icon, favicon, nav bar), the symbol alone is used.
- No decorative ligatures or playful distortions; keep it calm, modern, and approachable.

Light vs dark usage:
- Light theme: symbol drawn primarily in dark neutral lines with the teal accent on a light/white background.
- Dark theme: symbol drawn primarily in light neutral lines with the teal accent on a dark background.
- Geometry is identical across themes; only colors swap.

Constraints:
- Do not introduce medical symbols (crosses, ECG spikes, pills, stethoscopes).
- Avoid aggressive “gym” motifs (dumbbells, flexing arms, flames, heavy italic sports fonts).

### 1.2 Brand Color

Bayand uses a single brand accent color, teal `#12B886`, primarily for logo and marketing surfaces, not as a general in-app interactive color.

Brand accent:
- Base: `#12B886` (Bayand teal; modern, fresh wellness vibe).
- Darker hover/alt: `#0F9A73` (approximately 15% darker for hover states).
- Soft/halo: `rgba(18, 184, 134, 0.10)` (subtle tinted backgrounds, chips, halos).

Role:
- Appears in the habit rings logo as the key accent segment.
- Dominant accent on the marketing website (buttons, highlighted headings, key icons).
- May appear sparingly in in-app “brand” contexts (splash screen, about page icon), but not as the main interactive color.

Non-role:
- Teal is not used as the primary button color or generic interactive color inside the app.
- Teal is not used for status states (success, error, warning, info).

### 1.3 Color Palette Overview

Bayand keeps a clear separation between:
- Website palette — dark-only marketing surface.
- App palette — neutral light/dark themes with blue interactive color.

#### 1.3.1 Website Palette (Always Dark)

The marketing website is permanently dark-themed. Its palette is built around near-black backgrounds and the Bayand teal accent.

Website colors:
- Page background: `#0e0e0e` — near-black.
- Card surface: `#161616` — slightly lifted from the page background.
- Raised surface: `#1f1f1f` — for inputs, feature cards, nav buttons.
- Accent: `#12B886` — Bayand teal; primary highlight and CTA color.
- Accent (hover/dim): `#0F9A73` — darker teal for hover states and dimmed accents.
- Primary text: `#f0ede6` — warm off-white, avoids the harshness of pure white.
- Secondary text: `#888888` — supporting copy, muted text.
- Border: `#2a2a2a` — subtle dividers and outlines.

Usage:
- All primary CTAs, key links, active nav states, and important icons use the accent teal.
- Hover states darken teal or add a subtle teal outline or halo.
- Decorative uses (chips, badges, icon backgrounds) use soft accent `rgba(18, 184, 134, 0.10)`.
- Maintain strong contrast between text and background; avoid teal for body text.

#### 1.3.2 App Palette (Light + Dark)

The app reuses a Tailwind-like neutral gray ramp and a blue interactive color to ensure accessibility and clarity.

Grays (light/dark mapping):
- White: `#ffffff`
  - Light: primary surface.
  - Dark: not used as a surface.
- Gray-50: `#f9fafb`
  - Light: page background.
  - Dark: not used as a surface.
- Gray-100: `#f3f4f6`
  - Light: hover or tertiary surface.
  - Dark: not used as a surface.
- Gray-200: `#e5e7eb`
  - Light: active state, horizontal rules, subtle separators.
  - Dark: not used as a surface.
- Gray-300: `#d1d5db`
  - Light: borders.
  - Dark: not used as a surface.
- Gray-400: `#9ca3af`
  - Light: muted text.
  - Dark: tertiary text.
- Gray-500: `#6b7280`
  - Light: tertiary text.
  - Dark: muted text.
- Gray-600: `#4b5563`
  - Light: secondary text.
  - Dark: active state or strong border.
- Gray-700: `#374151`
  - Light: rarely used text or deep borders.
  - Dark: hover or tertiary surface.
- Gray-800: `#1f2937`
  - Light: rarely used background.
  - Dark: primary surface.
- Gray-900: `#111827`
  - Light: primary text.
  - Dark: page background.

Interactive blue:
- Default: `#3b82f6` (blue-500) — primary interactive color.
- Hover or active in light theme: `#2563eb` (blue-600).
- Hover or active in dark theme: `#60a5fa` (blue-400).

Roles:
- All primary buttons, links, focus rings, selected states, toggles, and checkboxes use blue.
- Blue indicates action or interaction, not brand identity.

Teal vs blue:
- Teal is brand identity (logo, marketing, occasional brand moments).
- Blue is interaction affordance inside the app.

#### 1.3.3 Status Colors

Status colors remain semantic, not decorative.

- Success: green.
- Error: red.
- Warning: amber.
- Info: blue.

Rules:
- Use status colors only for feedback states such as alerts, toasts, and validation.
- Do not use status colors for non-status decoration or brand styling.
- Do not reassign teal as a status color; teal remains separate from success green.

#### 1.3.4 Highlight Color

If an editor or “mark” feature exists:

- Light theme highlight: a warm amber such as `#b45309`.
- Dark theme highlight: a lighter amber such as `#fbbf24`.

This keeps highlight distinct from both blue and teal.

### 1.4 Typography

Bayand preserves an offline- and privacy-friendly typography strategy: no web font downloads.

Font stacks:
- UI text:
  - `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif`
- Monospace:
  - `'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace`

Usage:
- App UI, marketing site, and wordmark all use the UI stack for consistency.
- Monospace is reserved for code, logs, or technical snippets.

Guidelines:
- Prefer regular to medium weights for most text and reserve bold for headings and key labels.
- Avoid condensed or overly playful fonts.
- Line length and spacing should favor comfortable reading over density.

### 1.5 Theming Model

Surfaces and theming strategy:

- Website:
  - Dark-only.
  - No theme toggle; the marketing site always uses the dark palette with teal accent.

- App:
  - Supports light and dark themes.
  - Theme is controlled by a `.dark` class on the root element, set via explicit user preference stored locally.
  - The app does not rely solely on OS-level `prefers-color-scheme`; the user’s choice is authoritative.

Surfaces:
- Surfaces are mapped via semantic tokens such as `bg-primary`, `bg-secondary`, and `bg-tertiary`, with each token having both light and dark variants.
- New UI elements must use these tokens rather than raw hex values.

### 1.6 Design Decisions Summary

| Decision                         | Choice                                              | Rationale                                                                 |
|----------------------------------|-----------------------------------------------------|---------------------------------------------------------------------------|
| Brand color                      | Teal `#12B886`                                     | Signals modern wellness, balance, and longevity, not medical urgency.     |
| App interactive color            | Blue `#3b82f6` (family)                            | Clear affordance and strong contrast; separated from brand teal.          |
| Website theme                    | Always dark                                         | Lets teal stand out and fits privacy or local-first positioning.          |
| App theme                        | Light default, dark available                       | Matches OS conventions and comfort for daily use.                         |
| Brand font                       | System UI stack                                     | Offline- and privacy-friendly, consistent with the app.                   |
| Logo motif                       | Habit rings plus central dot                        | Evokes cycles, habits, and long-term wellness without medical imagery.    |
| Status colors                    | Green, red, amber, blue                             | Semantic meaning only, not decoration.                                    |
| Highlight color                  | Amber (light and dark variants)                     | Distinct from blue (interaction) and teal (brand).                        |

----

## 2. Implementation

This section describes how the design language is translated into code: variables, classes, and file locations.

### 2.1 Logo

Files:
- Source: `public/bayand-logo.svg` at 1024×1024.
- Exported icon sizes: generated from this source via the existing icon pipeline.

SVG design guidelines:
- ViewBox: `0 0 1024 1024`.
- Central dot: a circle with a radius that is clearly visible at small sizes, for example around 80 to 100 units at this scale.
- Rings: two or three circles drawn as strokes, with rounded stroke caps and joins.
  - Example inner ring radius: around 220.
  - Example middle ring radius: around 320.
  - Example outer ring radius: around 420.
  - Stroke width: thick enough for clarity at small sizes, such as around 80 units, then adjusted after testing.
- Accent segment:
  - One arc of the outer ring uses teal `#12B886`.
  - The remainder of the outer ring and all other rings use a neutral color such as black or dark gray on light backgrounds, and white or light gray on dark backgrounds.
  - The accent arc covers a fraction of the circle sufficient for visibility at small sizes, for example between 60 and 120 degrees.

App icon:
- Background:
  - Light variant: white or very light neutral with the symbol in dark neutral plus teal accent.
  - Dark variant: near-black or dark neutral with the symbol in light neutral plus teal accent.
- The symbol is centered with ample padding so the rings are not cramped by the corners.

### 2.2 Website

Structure:
- Directory: `website/`
- CSS: `website/css/bayand.css` or integrated into an existing stylesheet with Bayand-specific tokens.

CSS custom properties:

Root variables:
- `--bg:          #0e0e0e;`
- `--bg-card:     #161616;`
- `--bg-raised:   #1f1f1f;`
- `--accent:      #12B886;`
- `--accent-dim:  #0F9A73;`
- `--accent-soft: rgba(18, 184, 134, 0.10);`
- `--text:        #f0ede6;`
- `--text-muted:  #888888;`
- `--border:      #2a2a2a;`
- `--radius:      10px;`
- `--radius-lg:   16px;`

Usage patterns:
- Body and root surface:
  - `background-color: var(--bg);`
  - `color: var(--text);`
- Cards:
  - `background-color: var(--bg-card);`
  - `border-radius: var(--radius-lg);`
  - `border: 1px solid var(--border);`
- Primary CTA buttons:
  - `background-color: var(--accent);`
  - `color: #0e0e0e;`
  - `border-radius: var(--radius);`
  - Hover state:
    - `background-color: var(--accent-dim);`
- Text links:
  - Default color: `var(--accent);`
  - Hover: underlined or slightly darkened using `var(--accent-dim);`
- Decorative halos and chips:
  - `background-color: var(--accent-soft);`
  - Text and icons inside use `var(--accent);`

Accessibility:
- All text must meet at least WCAG AA contrast against the background.
- Teal is primarily used for accents and not as the main body text color.

### 2.3 App

Structure:
- Directory: `src/`
- Theme definitions: `src/index.css` or another central theme file.
- Theming mechanism: `.dark` class on the root element.

#### 2.3.1 Theme Tokens

Light theme (`:root`):

Backgrounds:
- `--bg-primary:   #ffffff;`
- `--bg-secondary: #f9fafb;`
- `--bg-tertiary:  #f3f4f6;`
- `--bg-hover:     #f3f4f6;`
- `--bg-active:    #e5e7eb;`

Text:
- `--text-primary:   #111827;`
- `--text-secondary: #4b5563;`
- `--text-tertiary:  #6b7280;`
- `--text-muted:     #9ca3af;`

Borders:
- `--border-primary:   #d1d5db;`
- `--border-secondary: #e5e7eb;`

Interactive:
- `--interactive:         #3b82f6;`
- `--interactive-hover:   #2563eb;`
- `--interactive-soft:    rgba(59, 130, 246, 0.10);`

Status:
- Success:
  - `--status-success-bg:     rgba(34, 197, 94, 0.10);`
  - `--status-success-border: #22c55e;`
  - `--status-success-text:   #166534;`
- Error:
  - `--status-error-bg:       rgba(239, 68, 68, 0.10);`
  - `--status-error-border:   #ef4444;`
  - `--status-error-text:     #991b1b;`
- Warning:
  - `--status-warning-bg:     rgba(245, 158, 11, 0.10);`
  - `--status-warning-border: #f59e0b;`
  - `--status-warning-text:   #92400e;`
- Info:
  - `--status-info-bg:        rgba(59, 130, 246, 0.10);`
  - `--status-info-border:    #3b82f6;`
  - `--status-info-text:      #1d4ed8;`

Brand accent:
- `--brand-accent:       #12B886;`
- `--brand-accent-dim:   #0F9A73;`
- `--brand-accent-soft:  rgba(18, 184, 134, 0.10);`

Dark theme (`.dark`):

Backgrounds:
- `--bg-primary:   #1f2937;`
- `--bg-secondary: #111827;`
- `--bg-tertiary:  #374151;`
- `--bg-hover:     #374151;`
- `--bg-active:    #4b5563;`

Text:
- `--text-primary:   #f9fafb;`
- `--text-secondary: #e5e7eb;`
- `--text-tertiary:  #9ca3af;`
- `--text-muted:     #6b7280;`

Borders:
- `--border-primary:   #4b5563;`
- `--border-secondary: #374151;`

Interactive:
- `--interactive:         #3b82f6;`
- `--interactive-hover:   #60a5fa;`
- `--interactive-soft:    rgba(59, 130, 246, 0.20);`

Status:
- Same hue families as light theme, tuned for dark backgrounds.

Brand accent:
- `--brand-accent:       #12B886;`
- `--brand-accent-dim:   #0F9A73;`
- `--brand-accent-soft:  rgba(18, 184, 134, 0.15);`

#### 2.3.2 Utility Classes

Background:
- `.bg-primary` uses `var(--bg-primary)`.
- `.bg-secondary` uses `var(--bg-secondary)`.
- `.bg-tertiary` uses `var(--bg-tertiary)`.
- `.bg-hover` uses `var(--bg-hover)`.
- `.bg-active` uses `var(--bg-active)`.

Text:
- `.text-primary` uses `var(--text-primary)`.
- `.text-secondary` uses `var(--text-secondary)`.
- `.text-tertiary` uses `var(--text-tertiary)`.
- `.text-muted` uses `var(--text-muted)`.

Borders:
- `.border-primary` uses `var(--border-primary)`.
- `.border-secondary` uses `var(--border-secondary)`.

Interactive:
- Primary button:
  - `background-color: var(--interactive);`
  - `color: #ffffff;`
  - Hover:
    - `background-color: var(--interactive-hover);`
  - Focus:
    - Outline or ring in `var(--interactive)` with visible offset.

Brand usage:
- `.brand-chip`:
  - `background-color: var(--brand-accent-soft);`
  - `color: var(--brand-accent);`

Status:
- `.status-success`, `.status-error`, `.status-warning`, `.status-info` map to the relevant `--status-*` tokens.

#### 2.3.3 Theming Behavior

- Apply or remove `.dark` on the root element based on user preference stored locally.
- On app startup, check stored preference and apply it before first paint when possible.
- All components must use CSS variables for colors so that theme switching works without per-component overrides.

#### 2.3.4 Logo Usage in App

- App icon:
  - Uses the rings symbol with teal accent and an appropriate background.
- In-app header:
  - Prefer the symbol-only variant, sized modestly, to avoid competing with content.
- About and settings screens:
  - May show the full logo with wordmark and teal accent.

### 2.4 Implementation Rules Checklist

- Backgrounds:
  - Use background tokens and classes instead of raw hex values.

- Text:
  - Use text tokens and classes to ensure consistent contrast and theming.

- Borders:
  - Use border tokens and classes for consistent line color and strength.

- Interactive elements:
  - Use blue for primary actions and interactive states.
  - Maintain visible focus indicators using blue.

- Status messages:
  - Use status tokens for feedback and never repurpose them for decoration.

- Brand teal:
  - Use only via `--brand-accent` and related tokens in logo, brand chips, and marketing surfaces.
  - Do not use teal as a general-purpose interactive color.

- Highlight:
  - Use dedicated highlight colors for editor marks or similar features.

- Theming:
  - Ensure every color has a dark-theme equivalent when used in components.
  - Introduce new tokens in both `:root` and `.dark` and document them.

- No raw hex:
  - All component styles must rely on tokens so that themes and palette changes remain centrally managed.

- Icons and illustrations:
  - Keep strokes thick enough for legibility at small sizes.
  - Use teal sparingly inside the app to avoid visual conflict with interactive blue.

## 3. Quick Reference: Key Bayand Values

- `#12B886` — Bayand brand teal.
- `#0F9A73` — Dim teal for hover or dim states.
- `rgba(18, 184, 134, 0.10)` — Soft teal background for chips and halos.
- `#3b82f6` — App interactive blue.
- `#2563eb` — App interactive blue hover in light theme.
- `#60a5fa` — App interactive blue hover in dark theme.
- `#0e0e0e` — Website near-black background.
- `#f0ede6` — Website primary text.
- `#111827` — Gray-900, used as primary text in light theme and background in dark theme.
- `#1f2937` — Gray-800, used as primary surface in dark theme.
- `#f9fafb` — Gray-50, used as secondary surface in light theme.
- `#ffffff` — White, used as primary surface and inverse text color in light theme.
- `#b45309` and `#fbbf24` — Amber highlight colors for light and dark themes.
