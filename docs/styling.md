# Styling Guide

The visual language for Trail Companion Web. It is derived from the `race-planner-mvp-clean.html` prototype (`../inspiration/`). Use it as the source of truth when building or restyling any component.

The look in one sentence: **a calm, mobile-first, rounded "fintech wallet" UI. Soft grey canvas, white cards with no borders, one heavy black hero card, pill-shaped buttons, a single geometric sans (Manrope), and colour used only to mean status.**

## Contents

1. [Design principles](#1-design-principles)
2. [Color](#2-color)
3. [Typography](#3-typography)
4. [Spacing, radius and elevation](#4-spacing-radius-and-elevation)
5. [Layout](#5-layout)
6. [Component reference](#6-component-reference)
7. [Icons](#7-icons)
8. [States and interaction](#8-states-and-interaction)
9. [Dark mode](#9-dark-mode)
10. [Implementing with Tailwind v4 and shadcn](#10-implementing-with-tailwind-v4-and-shadcn)
11. [Atomic design mapping](#11-atomic-design-mapping)
12. [Accessibility](#12-accessibility)
13. [Do and don't](#13-do-and-dont)

---

## 1. Design principles

1. **Mobile first, single column.** The whole app is a 520px column centered on the canvas. It is designed for a phone held in one hand on race day, then simply centered on desktop.
2. **Surfaces, not borders.** Structure comes from a white card sitting on a grey canvas, lifted by a very soft shadow. Borders are reserved for hairline dividers inside a card and for the error state on inputs.
3. **Round everything.** Cards are 22px, the hero is 26px, fields are 14px, buttons and pills are fully round. There are no sharp corners.
4. **One accent of contrast.** The black (or white in dark mode) hero card is the single loudest element on a page. Each screen has at most one.
5. **Color means status.** Blue is focus and information, green is "on target", red is "short" or destructive. Never use these for decoration.
6. **Heavy headings, quiet labels.** Titles are 800 weight with tight negative tracking. Labels are small, grey and bold. This contrast does most of the typographic work.
7. **Numbers are first-class.** Every number aligns in columns (`tabular-nums`) so values do not jitter as they change.
8. **Big touch targets.** Primary buttons are 50px tall, fields 46px, icon buttons 32 to 46px. Nothing tappable is smaller than 32px.

---

## 2. Color

All colors are semantic tokens. Components never use raw hex values. They reference tokens, so light and dark themes switch by swapping token values alone.

### 2.1 Light theme

| Token | Hex | Role |
|---|---|---|
| `--bg` | `#EFEFF1` | Page canvas behind everything |
| `--card` | `#FFFFFF` | Card surface |
| `--field` | `#F4F5F7` | Input fill, icon-button fill, readouts, progress track, number badges, `light` buttons |
| `--ink` | `#0E0F11` | Primary text, progress fill |
| `--ink-soft` | `#3A3F45` | Icon color inside `.ib` buttons, secondary text |
| `--muted` | `#8A8F98` | Labels, captions, placeholders, subtitles |
| `--line` | `#EAEBEE` | Hairline dividers inside cards |
| `--btn` | `#0E0F11` | Primary button fill and the hero card fill |
| `--btn-ink` | `#FFFFFF` | Text/icons on `--btn` |
| `--blue` | `#2563EB` | Focus ring, informational pill text |
| `--blue-soft` | `#E7EFFD` | Blue pill background |
| `--green` | `#12804B` | Success text ("On target") |
| `--green-soft` | `#E6F6EC` | Green pill background |
| `--red` | `#D23B3B` | Error, "short", destructive armed state |
| `--red-soft` | `#FCEBEB` | Red pill background |
| `--nutrition-gel` / `-soft` | `#6D28D9` / `#F1EBFD` | Gel type badge (category, see 2.4) |
| `--nutrition-liquid` / `-soft` | `#0F766E` / `#E3F5F3` | Liquid type badge |
| `--nutrition-solid` / `-soft` | `#92400E` / `#FDF1DC` | Solid type badge |
| `--nutrition-pill` / `-soft` | `#475569` / `#EEF1F5` | Pill type badge |

### 2.2 Dark theme

| Token | Hex |
|---|---|
| `--bg` | `#0C0D0F` |
| `--card` | `#17191C` |
| `--field` | `#1F2227` |
| `--ink` | `#F2F3F5` |
| `--ink-soft` | `#D2D6DB` |
| `--muted` | `#8F959E` |
| `--line` | `#24282D` |
| `--btn` | `#FFFFFF` |
| `--btn-ink` | `#0E0F11` |
| `--blue` | `#7FA9FF` |
| `--blue-soft` | `#1B2436` |
| `--green` | `#5BD48D` |
| `--green-soft` | `#12271C` |
| `--red` | `#FF7B7B` |
| `--red-soft` | `#2B1717` |
| `--nutrition-gel` / `-soft` | `#C4A7FF` / `#231B36` |
| `--nutrition-liquid` / `-soft` | `#5ED3C6` / `#0F2624` |
| `--nutrition-solid` / `-soft` | `#F5C26B` / `#2A2112` |
| `--nutrition-pill` / `-soft` | `#B6C0CE` / `#20252D` |

Note the inversion: in dark mode `--btn` becomes white, so the hero card and primary buttons turn white with dark text. Status colors get lighter and their soft backgrounds become deep tints.

### 2.3 Color rules

- **Text on canvas or card:** `--ink` for content, `--muted` for supporting text. Never lighter than `--muted`.
- **Status pills:** always pair `--{color}` text with `--{color}-soft` background. Never put status text on white directly for badges.
- **Inversion pairing:** anything on `--btn` uses `--btn-ink`. Inside the hero, secondary text is `--btn-ink` at 60 to 65% opacity, tertiary at 45%.
- **Overlays on the hero:** translucent white (`rgba(255,255,255,.14)` for pill fields, `.2` for the progress track). These are the only sanctioned hard-coded colors.
- **Thresholds:** a progress metric is "on target" (green) at 95% or more of its goal, otherwise "short" (red). "Over" is still green with an "N over" label. Do not introduce amber unless a design explicitly calls for it.

### 2.4 Category scale (nutrition type)

`--nutrition-{gel,liquid,solid,pill}` and their `-soft` backgrounds label **what an item is**. This is a category scale, not status colour: it never means success, failure, on target or short, and status meaning never uses it. Hues (violet, teal, amber, slate) are chosen to stay distinct from `--green` and `--red`. Always pair text with its `-soft` background; the only mapping is `NUTRITION_TYPE_CLASSES` in `src/lib/planMath.ts`. Every pair meets 4.5:1 (light 4.9 to 6.7, dark 8.1 to 9.7).

---

## 3. Typography

### 3.1 Font

**Manrope** (Google Fonts), weights 400, 500, 600, 700, 800. It is a geometric sans with distinctive numerals, which suits a data-heavy app.

Stack: `'Manrope', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif`.

Install self-hosted rather than linking Google Fonts:

```bash
npm install @fontsource-variable/manrope
```

```ts
// src/main.tsx
import "@fontsource-variable/manrope"
```

```css
/* src/index.css, inside @theme inline */
--font-sans: "Manrope Variable", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
```

### 3.2 Global settings

```css
body {
  font: 16px/1.5 var(--font-sans);
  -webkit-font-smoothing: antialiased;
  font-variant-numeric: tabular-nums;
}
button, input, textarea {
  font: inherit;
  color: inherit;
  font-variant-numeric: tabular-nums;
}
```

Form controls must use **16px** font size. Anything smaller makes iOS Safari zoom the page on focus.

### 3.3 Type scale

| Role | Size | Weight | Tracking | Line height | Color | Notes |
|---|---|---|---|---|---|---|
| Page title (`h1`) | `1.55rem` (24.8px) | 800 | `-0.03em` | 1.15 | `--ink` | One per screen |
| Hero number (`.big`) | `2.1rem` (33.6px) | 800 | `-0.03em` | 1.1 | `--btn-ink` | Trailing unit is `1rem`, weight 600, 60% opacity |
| Hero input | `1.35rem` (21.6px) | 800 | `-0.03em` | n/a | inherit | Editable title on the hero |
| Card title / race name | `1.05rem` (16.8px) | 800 | `-0.02em` | n/a | `--ink` | |
| Body | `1rem` (16px) | 500 to 600 | none | 1.5 | `--ink` | Inputs are weight 600 |
| Button | `0.95rem` (15.2px) | 700 | none | n/a | | Small buttons `0.8125rem` |
| List item name | `0.95rem` | 600 | none | n/a | `--ink` | Amounts beside it are weight 800 |
| Caption / small | `0.8125rem` (13px) | 500 to 600 | none | n/a | `--muted` | Subtitles, rail captions |
| Field label | `0.75rem` (12px) | 700 | none | n/a | `--muted` | Sits above inputs, 6px gap |
| Section label | `0.75rem` | 800 | none | n/a | `--muted` | `margin: 16px 0 8px` |
| Pill | `0.75rem` | 700 | none | n/a | status color | |

Rules:

- **Weight is hierarchy.** Titles and key numbers are 800. Interactive text is 700. Everything else is 500 to 600. Do not use 400 for anything except placeholders and long notes text.
- **Tracking tightens as size grows.** `-0.03em` at title size, `-0.02em` at card-title size, none below 1rem.
- **No uppercase, no letter-spaced labels.** Labels are sentence case. This differs from the shadcn default label, so override it.
- **Units are quieter than values.** Show `60` in weight 800 and `g/h` in weight 600 at 60 to 70% opacity or `--muted`.
- **Numbers always tabular.** Set globally, never turn it off.

---

## 4. Spacing, radius and elevation

### 4.1 Spacing

There is no rigid scale in the prototype. These are the values it actually uses, and new work should stay on them.

| Use | Value |
|---|---|
| Page gutter (left/right) | `18px` |
| Page top / bottom | `8px` / `40px` |
| Gap between stacked cards | `14px` (`.stack`) |
| Card padding | `16px` |
| Hero padding | `18px` |
| Inline gap between icon and text | `8px` |
| Gap inside rows of controls | `6px` to `10px` |
| Label to field | `6px` |
| Between form groups inside a card | `12px` |
| Header padding | `12px 0 18px` |
| Hairline list row padding | `9px 0` |

In Tailwind terms: gutter `px-[18px]`, stack `gap-3.5`, card `p-4`, control rows `gap-1.5` / `gap-2` / `gap-2.5`.

### 4.2 Radius

| Element | Radius |
|---|---|
| Hero | `26px` |
| Card | `22px` |
| Input, textarea, readout, number badge | `14px` |
| Buttons, pills, icon buttons, circles, progress bar | fully round (`999px` / `50%`) |

Set `--radius: 14px` in the theme and derive: field = `--radius`, card = `--radius + 8px`, hero = `--radius + 12px`.

### 4.3 Elevation

Exactly one shadow token, used on every card and circle button in light mode:

```css
--shadow: 0 1px 2px rgba(16,24,40,.04), 0 10px 26px rgba(16,24,40,.05);
```

In dark mode the shadow is `none`. Depth comes from the lighter card fill against the darker canvas instead. The hero has no shadow in either theme. Nested surfaces (icon buttons inside a card, race icon) also have no shadow.

---

## 5. Layout

### 5.1 App frame

```
┌───────────────────────────────┐  body: --bg
│        (canvas margin)        │
│   ┌───────────────────────┐   │
│   │ header                │   │  .app: max-width 520px, centered
│   │ hero card             │   │  padding: 8px 18px 40px
│   │ card                  │   │
│   │ card                  │   │  stack gap 14px
│   │      quiet action     │   │
│   └───────────────────────┘   │
└───────────────────────────────┘
```

```css
.app { max-width: 520px; margin: 0 auto; padding: 8px 18px 40px; }
```

Do not build multi-column desktop layouts. If a screen needs more room, add another vertical section, not a sidebar. The column stays 520px on all viewports.

### 5.2 Header patterns

Two variants, both `display:flex; align-items:center; gap:12px; padding:12px 0 18px`.

**List header (root screens):**

```
Races                                   <- h1, 800
Plan each segment's fuel and pace       <- .sub, muted 13px
```

**Detail header (drilled-in screens):**

```
(‹)        Race plan         ( )
```

A 42px circle back button on the left, a centered 800-weight title, and an invisible 42px circle on the right so the title stays truly centered.

### 5.3 Page composition

1. Header
2. Hero card (summary of the current context, only on detail screens)
3. Stack of content cards
4. Quiet destructive action, centered, below the stack

List screens are: header, list of tappable cards, then a "create" card at the bottom containing one field and one full-width primary button.

### 5.4 Grids

- **Three-up field row** (`grid3`): `grid-template-columns: 1fr 1fr auto; gap:10px; align-items:end`. Two inputs plus one auto-width readout, all bottom-aligned so labels sit on one line.
- **List row** (`item`): `grid-template-columns: 1fr auto auto; gap:10px; align-items:center`. Name, amount, controls.
- **Add row** (`add`): `grid-template-columns: 1fr 72px auto; gap:8px`. Text input, small numeric input, large dark icon button.

### 5.5 Flex helpers

Compose these rather than inventing new layout classes: a `row` (flex, center, gap 8px), `between` (space-between), and `grow` (`flex:1; min-width:0`). `min-width:0` on `grow` is required so inputs and long names shrink instead of overflowing.

---

## 6. Component reference

Each component lists its anatomy, exact metrics and variants. Class names refer to the prototype. Section 10 maps them onto shadcn.

### 6.1 Card

The default container. White, borderless, round, softly lifted.

```
background: var(--card); border-radius: 22px; padding: 16px; box-shadow: var(--shadow);
```

- Interactive cards (a list entry that navigates) are rendered as `<button>`, `display:block; width:100%; text-align:left; padding:16px; margin-bottom:12px`.
- Empty states are a card with `text-align:center; padding:26px 16px`, a bold one-line title and a `small muted` line beneath (4px gap).
- Do not add borders or ring outlines to cards.

### 6.2 Hero card

The single high-contrast summary card at the top of a detail screen.

```
background: var(--btn); color: var(--btn-ink); border-radius: 26px; padding: 18px;
```

Anatomy, top to bottom:

1. **Title row.** An inline, transparent, borderless text input (21.6px, 800, `-0.03em`) that fills the row, and a **pill field** on the right (see 6.5).
2. **Label** (`.lab`): 13px, 600, 60% opacity. Margin-top 14px.
3. **Big number** (`.big`): 33.6px, 800, with a trailing unit span at 1rem / 600 / 60% opacity.
4. **Progress rail** (margin-top 14px), recolored: track `rgba(255,255,255,.2)`, fill `var(--btn-ink)`.
5. **Rail caption:** left text at 65% opacity, right status text at 90%.
6. **Primary action:** full-width `onhero` button, margin-top 16px.

Inputs inside the hero are transparent (`background:transparent; border:0; padding:0; min-height:36px; border-radius:0`) and use `currentColor` at 45% opacity for placeholders. The hero shows status as plain text, not as a pill, because pills do not read on the inverted surface.

### 6.3 Buttons

Base `.btn`:

```
min-height: 50px; padding: 0 20px; border-radius: 999px;
background: var(--btn); color: var(--btn-ink);
font: 700 0.95rem; display: inline-flex; align-items:center; justify-content:center; gap:8px;
```

| Variant | Class | Look | Use |
|---|---|---|---|
| Primary | `.btn` | Black pill, white text (inverts in dark) | Main action on a card |
| Light | `.btn.light` | `--field` fill, `--ink` text | Secondary action |
| On hero | `.btn.onhero` | `--btn-ink` fill, `--btn` text (inverse of primary) | Action inside the hero |
| Block | `.btn.block` | `width:100%` | Full-width stacked actions |
| Small | `.btn.sm` | `min-height:40px; font-size:.8125rem; padding:0 14px` | Compact inline actions |
| Quiet | `.btn.quiet` | Transparent, `--muted`, 600, 13px, 40px tall, no padding | Destructive or low-priority text actions |
| Quiet armed | `.btn.quiet.armed` | Text turns `--red` | Second-tap confirmation state |

Icons inside buttons are 20px, `gap:8px` from the label, and always lead the label ("+ Create race").

**Destructive actions use the two-tap pattern, not a modal.** First tap turns the quiet button red and changes its label to "Tap again to delete". It reverts after 3 seconds. A second tap within that window confirms.

### 6.4 Icon buttons

Small round buttons that hold only an icon.

```
.ib      width/height 36px; border-radius 50%; background var(--field); color var(--ink-soft); display grid; place-items center
.ib.lg   46px
.ib.dark background var(--btn); color var(--btn-ink)     (the primary icon action, e.g. "Add")
.ib:disabled  opacity .35; cursor default
```

Inside list rows, `.ib` shrinks to 32px. Always provide an `aria-label`. Reorder controls (up/down) use `.ib` and disable at the ends of the list.

### 6.5 Circles

`.circ` is a 42px white circle with `--shadow`, used for the header back button and for round icon badges. When nested inside a card (for example the race icon on a list card), override to `background: var(--field); box-shadow: none` and 40px.

### 6.6 Pill field

A translucent capsule that holds a small numeric input plus its unit, used on the hero (for example "60 g/h").

```
display:flex; align-items:center; gap:6px;
background: rgba(255,255,255,.14); border-radius: 999px; padding: 4px 12px; flex: none;
input: width 44px; text-align:right; 16px; weight 700; min-height 32px
unit:  13px; weight 600; opacity .7
```

### 6.7 Form fields

**Label** (`label.f`): block, 12px, 700, `--muted`, `margin-bottom:6px`.

**Input / textarea:**

```
width:100%; min-height:46px; background: var(--field);
border: 1px solid transparent; border-radius: 14px; padding: 11px 14px;
font-size: 16px; font-weight: 600;
```

- Textarea: `min-height:66px; resize:vertical; line-height:1.45; font-weight:500`.
- Placeholder: `--muted`, weight 500.
- **Invalid:** border becomes `1px solid var(--red)`. No error text is required for inline fields. The red border plus focus is the signal. Provide message text for forms with server validation (small, `--red`, 13px, 6px above).
- **Focus:** the global focus ring (see 8.1). The border stays transparent.
- Fields have no visible resting border. The `--field` fill against the white card is the only affordance.

**Readout** (`.readout`): a non-editable value styled like a field. `background: var(--field); border-radius:14px; min-height:46px; padding:0 14px; display:flex; align-items:center; font-weight:700; white-space:nowrap`. Use it for computed values (for example pace) so they line up with editable fields.

**Inline title inputs** (`.seg-name`): transparent, borderless, 34px, 16.8px, 800, `-0.02em`. They look like text but are editable. Use only for a card's own title.

### 6.8 Pills (status badges)

```
display:inline-flex; align-items:center; gap:6px; white-space:nowrap;
border-radius:999px; padding:5px 12px; font: 700 .75rem;
```

| Variant | Background | Text |
|---|---|---|
| `blue` | `--blue-soft` | `--blue` |
| `green` | `--green-soft` | `--green` |
| `red` | `--red-soft` | `--red` |

Every status pill starts with a 6px dot (`background: currentColor; border-radius:50%`) followed by the label ("On target", "12 g short"). The dot is what makes them read as status rather than tags.

### 6.9 Progress rail

A thin bar plus a caption row. Used for anything that measures progress toward a goal.

```
.bar  height:6px; border-radius:99px; background: var(--field); overflow:hidden
.fill height:100%; border-radius:99px; background: var(--ink); transition: width .2s
.cap  display:flex; justify-content:space-between; align-items:center; gap:10px;
      margin-top:8px; font: 600 .8125rem
```

- The fill is **always neutral ink**, never green or red. Status is communicated by the pill in the caption, so the bar stays calm.
- Width is clamped 0 to 100%.
- The left caption holds the numbers ("**120 g** of 150 g" with the bold part in `--ink` and the rest `--muted`). The right caption holds a status pill (or plain text on the hero).
- When no data exists yet, render an empty bar and a single muted sentence explaining what to add.

### 6.10 Card header with index badge

For repeated sections (for example segments), each card opens with a header row (`gap:10px; margin-bottom:14px`):

1. **Number badge** (`.seg-num`): 38px square, `border-radius:14px`, `--field` fill, 800, 14.4px, centered.
2. **Inline title input** that grows.
3. **Up/down icon buttons** for reordering.

### Aid station card

- Same white card as a segment, full width. Identity comes from the lucide `Tent` icon in the 38px number slot, never from colour or an emoji. No ETA, time, distance, pace or progress rail: a stop has no duration of its own.
- Kit certainty pills: `Planned` is solid `--btn`/`--btn-ink`; `Maybe` is a dashed `--muted` outline with `--ink-soft` text. Neutral, not status colour.
- The segment after a station shows one muted, read-only row at the top of its item list: `Tent` icon, "At {station}", station carbs. The segment's progress bar stays one colour; its numbers include station carbs.
- Empty gaps between segments show a quiet dashed "+ Aid station" pill.

### 6.11 List rows

Rows inside a card are separated by hairlines, not gaps.

```
.item { display:grid; grid-template-columns: 1fr auto auto; gap:10px; align-items:center;
        padding:9px 0; border-top:1px solid var(--line); }
.nm { font-weight:600; font-size:.95rem }
.c  { font-weight:800; white-space:nowrap }        /* the amount */
.ctl{ display:flex; gap:6px }                      /* three 32px .ib buttons */
```

Every row has a top border, including the first, so the list is visually anchored under its section label. The empty state is a single muted small line with the same top border.

### 6.12 Section label

`.sec`: 12px, 800, `--muted`, `margin:16px 0 8px`. Sentence case ("Nutrition, in order"). It introduces a list within a card.

### 6.13 Quiet footer action

A right-aligned (in a card) or centered (below the stack) `.btn.quiet` for delete. `margin-top:14px` inside a card, `8px` below the stack.

---

## 7. Icons

Inline SVG, stroke-only, no fill. One consistent style:

```
viewBox 24x24; fill none; stroke currentColor; stroke-width 2.2;
stroke-linecap round; stroke-linejoin round; aria-hidden="true"
```

| Context | Size |
|---|---|
| Default | 18px |
| Add (plus), back, flag in buttons/headers | 20px |
| Remove (x) | 15px |
| Chevron in list cards | 18px |

Use **lucide-react** (already installed) and set `strokeWidth={2.2}` so it matches. Icons inherit color from the parent (`currentColor`) and never carry their own color.

Icon set used: chevron up/down (reorder), x (remove), plus (add), chevron left/right (navigation), flag (race).

---

## 8. States and interaction

### 8.1 Focus

```css
:focus-visible { outline: 2px solid var(--blue); outline-offset: 2px; }
```

Global, on every focusable element. Do not remove it. Do not add a second ring.

### 8.2 Hover and press

The prototype is touch-first and defines no hover or active styles. On desktop, add only subtle ones, and only when they do not conflict with the tokens:

- Buttons: `opacity: .9` on hover, `transform: translateY(1px)` on active.
- Icon buttons: no change. Their shape is the affordance.

### 8.3 Disabled

`opacity: .35; cursor: default`. Disabled controls stay in the layout so rows do not shift (for example the "up" button on the first item).

### 8.4 Validation

- Mark the control `.invalid` (red border) on submit failure and focus the first offender.
- Clear `.invalid` as soon as the user types.
- Parse liberally and normalize on blur (for example accept `3` and format to `3:00`).

### 8.5 Motion

Almost none. The only transition is the progress fill width at `.2s`. Do not add page transitions, springs or entrance animations. Updates are instant, and computed values refresh in place while the user types, without losing focus.

### 8.6 Empty states

A centered card, bold title ("No races yet") and one muted line explaining the next step. No illustrations.

---

## 9. Dark mode

Follow the system by default and allow a manual override with `data-theme` on `<html>`.

```css
:root, :root[data-theme="light"] { /* light tokens */ color-scheme: light; }

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* dark tokens */ color-scheme: dark; }
}

:root[data-theme="dark"] { /* dark tokens */ color-scheme: dark; }
```

Behavior differences beyond token swaps:

- `--shadow` is `none`. Cards separate from the canvas by fill difference alone.
- `--btn` / `--btn-ink` invert, so the hero card and primary buttons become white with dark text.
- Translucent white overlays on the hero (pill field, track) still use `rgba(255,255,255,…)` in dark mode, but they sit on a white hero, so they read as light grey. In practice, keep them and verify contrast when building the hero.
- Always set `color-scheme` so native controls (scrollbars, number spinners) match.

---

## 10. Implementing with Tailwind v4 and shadcn

The project uses Tailwind v4 (config lives in CSS) and shadcn/ui (`radix-nova`, CSS variables). Map the tokens onto the shadcn variable names so every shadcn component picks up the theme automatically, and add the extra status tokens as custom colors.

### 10.1 Token mapping

| Prototype | shadcn variable | Notes |
|---|---|---|
| `--bg` | `--background` | Canvas |
| `--ink` | `--foreground` | |
| `--card` | `--card` | |
| `--ink` | `--card-foreground` | |
| `--card` | `--popover` | |
| `--ink` | `--popover-foreground` | |
| `--btn` | `--primary` | |
| `--btn-ink` | `--primary-foreground` | |
| `--field` | `--secondary` | |
| `--ink` | `--secondary-foreground` | |
| `--field` | `--muted` | Fills |
| `--muted` | `--muted-foreground` | Text (note the swapped meaning) |
| `--field` | `--accent` | |
| `--ink` | `--accent-foreground` | |
| `--red` | `--destructive` | |
| `--line` | `--border` | Hairlines |
| `transparent` | `--input` | Inputs have no border at rest |
| `--blue` | `--ring` | Focus |
| n/a | `--ink-soft`, `--blue`, `--blue-soft`, `--green`, `--green-soft`, `--red`, `--red-soft`, `--shadow` | Extra tokens, exposed to Tailwind |

### 10.2 `src/index.css`

```css
@import "tailwindcss";
@import "tw-animate-css";

@theme inline {
  --font-sans: "Manrope Variable", system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;

  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);

  --color-ink-soft: var(--ink-soft);
  --color-blue: var(--blue);
  --color-blue-soft: var(--blue-soft);
  --color-green: var(--green);
  --color-green-soft: var(--green-soft);
  --color-red: var(--red);
  --color-red-soft: var(--red-soft);

  --radius-md: var(--radius);                  /* 14px: fields */
  --radius-xl: calc(var(--radius) + 8px);      /* 22px: cards  */
  --radius-2xl: calc(var(--radius) + 12px);    /* 26px: hero   */
  --shadow-card: var(--shadow);
}

:root,
:root[data-theme="light"] {
  --radius: 14px;
  --background: #EFEFF1;
  --foreground: #0E0F11;
  --card: #FFFFFF;
  --card-foreground: #0E0F11;
  --popover: #FFFFFF;
  --popover-foreground: #0E0F11;
  --primary: #0E0F11;
  --primary-foreground: #FFFFFF;
  --secondary: #F4F5F7;
  --secondary-foreground: #0E0F11;
  --muted: #F4F5F7;
  --muted-foreground: #8A8F98;
  --accent: #F4F5F7;
  --accent-foreground: #0E0F11;
  --destructive: #D23B3B;
  --border: #EAEBEE;
  --input: transparent;
  --ring: #2563EB;

  --ink-soft: #3A3F45;
  --blue: #2563EB;  --blue-soft: #E7EFFD;
  --green: #12804B; --green-soft: #E6F6EC;
  --red: #D23B3B;   --red-soft: #FCEBEB;
  --shadow: 0 1px 2px rgba(16,24,40,.04), 0 10px 26px rgba(16,24,40,.05);
  color-scheme: light;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --background: #0C0D0F;
    --foreground: #F2F3F5;
    --card: #17191C;
    --card-foreground: #F2F3F5;
    --popover: #17191C;
    --popover-foreground: #F2F3F5;
    --primary: #FFFFFF;
    --primary-foreground: #0E0F11;
    --secondary: #1F2227;
    --secondary-foreground: #F2F3F5;
    --muted: #1F2227;
    --muted-foreground: #8F959E;
    --accent: #1F2227;
    --accent-foreground: #F2F3F5;
    --destructive: #FF7B7B;
    --border: #24282D;
    --ring: #7FA9FF;

    --ink-soft: #D2D6DB;
    --blue: #7FA9FF;  --blue-soft: #1B2436;
    --green: #5BD48D; --green-soft: #12271C;
    --red: #FF7B7B;   --red-soft: #2B1717;
    --shadow: none;
    color-scheme: dark;
  }
}

:root[data-theme="dark"] {
  /* same values as the media query block above */
}

@layer base {
  * { @apply border-border; }
  body {
    @apply bg-background text-foreground font-sans antialiased;
    font-variant-numeric: tabular-nums;
  }
  button, input, textarea { font: inherit; font-variant-numeric: tabular-nums; }
  button { cursor: pointer; }
  :focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
}
```

Duplicate the dark block under `:root[data-theme="dark"]`. CSS cannot share a rule between a media-query selector and a plain one, so keep both in sync (or generate one from the other).

### 10.3 shadcn component overrides

Edit the files in `src/components/ui/` (they are ours). Target values:

**`button.tsx`**

- Base: `rounded-full font-bold text-[0.95rem] gap-2 min-h-[50px] px-5`. Remove the default ring/press animation.
- Variants:
  - `default`: `bg-primary text-primary-foreground`
  - `secondary` (the "light" button): `bg-secondary text-secondary-foreground`
  - `onHero` (add): `bg-primary-foreground text-primary`
  - `quiet` (add, replaces `ghost` for destructive text buttons): `bg-transparent text-muted-foreground font-semibold text-[0.8125rem] min-h-10 px-0`
  - `destructive`: same as `quiet` but `text-red`, used for the armed state
- Sizes: `default` 50px, `sm` `min-h-10 text-[0.8125rem] px-3.5`, `icon` `size-9 rounded-full bg-secondary text-ink-soft`, `icon-lg` `size-[46px]`, plus a dark icon variant using `bg-primary text-primary-foreground`.

**`input.tsx` and a textarea**

```
min-h-[46px] w-full rounded-md bg-secondary border border-transparent px-3.5 py-[11px]
text-base font-semibold placeholder:text-muted-foreground placeholder:font-medium
aria-invalid:border-red focus-visible:outline-blue
```

**`card.tsx`**

```
rounded-xl bg-card p-4 shadow-card        /* no border, no ring */
```

Set `--card-spacing: 16px`. Remove the ring, the glow shadow and the footer border/background from the current card file.

**`label.tsx`**

```
block text-xs font-bold text-muted-foreground mb-1.5      /* not uppercase, no tracking */
```

### 10.4 Adding new shadcn components

Run `npx shadcn add <name>`, then immediately re-style the output against this guide: strip borders and rings, apply the radius scale, swap raw colors for tokens, and make sure hit areas meet the minimums in section 1.

---

## 11. Atomic design mapping

Where each piece from the prototype lives in `src/components`.

| Layer | Component | Source pattern |
|---|---|---|
| `ui` (shadcn) | `Button`, `Input`, `Textarea`, `Label`, `Card` | 6.1, 6.3, 6.7 |
| **atoms** | `Heading` (h1), `Subtitle`, `Pill` (variants blue/green/red with dot), `IconButton`, `Circle`, `ProgressBar`, `SectionLabel`, `ErrorText`, `Readout` | 6.4, 6.5, 6.8, 6.9, 6.12, 6.7 |
| **molecules** | `FormField` (label + input + error), `PillField` (input + unit), `ProgressRail` (bar + caption + status pill), `ListRow` (name + amount + controls), `PageHeader` (title + subtitle or back-title variant), `ConfirmButton` (two-tap quiet delete), `EmptyState` | 5.2, 6.3, 6.6, 6.9, 6.11, 8.6 |
| **organisms** | `HeroCard`, `LoginForm`, `EntityCard` (list card with icon, name, rail), `SectionCard` (index badge + title + fields + list + add row), `AddRow` | 6.2, 6.10, 5.4 |
| pages | Compose organisms inside the `.app` frame | 5.1, 5.3 |

Component rules:

- Atoms take styling props (`variant`, `size`) and `className`, merged with `cn()`. They have no knowledge of data.
- Molecules compose atoms and accept plain props. No fetching, no context.
- Organisms take data and callbacks as props. Pages own data fetching and wiring.
- A page wraps its content in a shared `AppFrame` (the 520px column with the gutter) so the layout is defined once.

---

## 12. Accessibility

- Every icon-only button has an `aria-label` that says what it does and to what ("Move Banana earlier"). Icons are `aria-hidden`.
- Labels are always tied to inputs (`htmlFor`/`id`). Inline title inputs get an `aria-label`.
- Color is never the only signal. Status pills carry text, and invalid inputs are also focused.
- Minimum contrast: `--muted` on `--card` is used only for supplementary text. Do not use it for anything that must be read to complete a task.
- Focus is always visible (8.1). Never `outline: none` without a replacement.
- The two-tap delete must not rely on timing alone. The label change ("Tap again to delete") is announced by keeping the same button focused.
- Set `viewport-fit=cover` and respect safe-area insets (`padding-bottom: max(40px, env(safe-area-inset-bottom))`) for notched phones.
- Respect `prefers-reduced-motion`. The only motion, the progress width transition, should be disabled for it.

---

## 13. Do and don't

**Do**

- Use tokens for every color, radius and shadow.
- Keep one hero per screen, at the top.
- Use weight 800 with negative tracking for titles and key numbers.
- Show status with a pill (dot plus text), and keep progress fills neutral.
- Use two-tap confirmation for destructive actions.
- Keep every screen a single 520px column.
- Use pill-shaped buttons and round icon buttons.

**Don't**

- Don't add borders or rings to cards. Depth is shadow (light) or fill (dark).
- Don't use uppercase or wide-tracked labels, which is the current default in the shadcn label and card title.
- Don't introduce new accent colors, gradients or decorative color.
- Don't use a modal for simple confirmations.
- Don't add hover animations, entrance animations or page transitions.
- Don't shrink form text below 16px.
- Don't put more than one high-contrast (hero-style) surface on a screen.
- Don't hard-code hex values in components. The only exceptions are the translucent white overlays on the hero.

---

## Appendix: prototype class to component quick map

| Prototype | Becomes |
|---|---|
| `.app` | `AppFrame` |
| `.head`, `h1`, `.sub` | `PageHeader` |
| `.circ` | `Circle` atom |
| `.card` | shadcn `Card` |
| `.hero` | `HeroCard` organism |
| `.pillfield` | `PillField` molecule |
| `.rail` (`.bar`, `.fill`, `.cap`) | `ProgressBar` atom + `ProgressRail` molecule |
| `.btn` (+ `light`, `onhero`, `block`, `sm`, `quiet`) | shadcn `Button` variants |
| `.ib` (+ `dark`, `lg`) | `IconButton` atom |
| `label.f` + input | `FormField` molecule |
| `.pill` (+ `blue`, `green`, `red`, `.dot`) | `Pill` atom |
| `.seg-head`, `.seg-num`, `.seg-name` | `SectionCard` organism header |
| `.grid3`, `.readout` | field row layout + `Readout` atom |
| `.sec` | `SectionLabel` atom |
| `.item`, `.nm`, `.c`, `.ctl` | `ListRow` molecule |
| `.add` | `AddRow` organism |
| `.race` | `EntityCard` organism |
| `.empty` | `EmptyState` molecule |
| `.foot` + `.btn.quiet` | `ConfirmButton` molecule |
