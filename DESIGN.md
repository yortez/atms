# DESIGN.md — ATMS / Alumni Portal Design System

Reusable design spec. Give this file to a developer or AI agent when starting a new project so it reproduces the same look and feel.

## 1. Stack (install first)

- Laravel + Inertia.js v3 + React 19 + TypeScript, Vite
- Tailwind CSS v4 (`@import 'tailwindcss'`, `@theme` tokens, no `tailwind.config.js`)
- shadcn/ui, **new-york** style, `baseColor: neutral`, CSS variables on, icons = `lucide-react`
- Radix UI primitives, `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css`
- `sonner` (toasts), `lenis` (smooth scroll), `input-otp`
- Helper: `cn()` in `@/lib/utils`. Alias `@` → `resources/js`.

`components.json`: aliases `components=@/components`, `ui=@/components/ui`, `lib=@/lib`, `hooks=@/hooks`, css = `resources/css/app.css`.

## 2. Design personality

Calm, clean, institutional "sage green" dashboard. Lots of white, hairline borders, very soft shadows, rounded corners, compact small type. Dense but airy; data-heavy admin screens. Light mode is the primary experience.

## 3. Color

### 3.1 Brand palette (used as arbitrary values in feature screens)

| Role | Hex | Usage |
|---|---|---|
| Primary / brand green | `#2b5139` | Primary buttons, active toggles, links, focus emphasis |
| Primary hover | `#203e2c` / `#22422d` | Hover on primary buttons |
| Ink (strong text) | `#29382e` | Headings, labels, button-ish text |
| Body secondary | `#526051` | Secondary text |
| Muted text | `#7a8278`, `#838c81`, `#858b82`, `#6d746a` | Hints, captions, empty states |
| Card/Surface | `#ffffff` | Cards, modals, panels |
| Surface tint | `#f9faf7`, `#f8f9f6`, `#f6f8f4` | Toolbars, row hover |
| Chip / track bg | `#f0f1ed`, `#f2f4f0` | Badges, progress track, icon-button hover |
| Border (default) | `#e9ebe5` | Cards, sections |
| Border (inner/list) | `#eff0ec` | Dividers, list rows |
| Border (inputs/buttons) | `#e4e7e0`, `#dfe5dd`, `#d6dfd3` | Form controls, outline buttons |
| Accent / progress fill | `#69866c` | Progress bars, charts |
| Toggle off | `#cbd2c9` | Switch off state |
| Scrollbar | thumb `#bcc9b9`, hover `#91a28e`, track `#f5f7f3` | `.portal-sidebar-nav` |
| Danger | text `#8b4e43`, border `#ecd8d2` | Error panels (also shadcn `destructive`) |
| Warning | `amber-50/50` bg, `amber-200/80` border, `amber-900` text | Notices |
| Overlay | `bg-black/40` | Modal / drawer backdrop |

> Tip for new projects: promote these hexes into theme tokens (`--color-brand: #2b5139`, etc.) instead of repeating arbitrary values (`#2b5139` is repeated ~150 times in the source).

### 3.2 shadcn theme tokens (`resources/css/app.css`)

Neutral grayscale in OKLCH, with a `.dark` override. Light: `--background oklch(1 0 0)`, `--foreground oklch(0.145 0 0)`, `--primary oklch(0.205 0 0)`, `--secondary/--muted/--accent oklch(0.97 0 0)`, `--muted-foreground oklch(0.556 0 0)`, `--border/--input oklch(0.922 0 0)`, `--ring oklch(0.87 0 0)`, `--destructive oklch(0.577 0.245 27.325)`. Dark: background `oklch(0.145 0 0)`, foreground `oklch(0.985 0 0)`, secondary/muted/accent/border `oklch(0.269 0 0)`, ring `oklch(0.439 0 0)`. Sidebar and chart tokens (`--chart-1..5`, `--sidebar-*`) follow the stock shadcn set. `@custom-variant dark (&:is(.dark *))`.

**To get the exact brand look in a new project**, set `--primary` to the brand green (`#2b5139`) and `--ring`/`--border` to the sage tones above so stock shadcn components match the custom screens.

Complete token block to copy: see `resources/css/app.css` (lines 11–137).

## 4. Typography

- Body: **Inter** (400/500/600/700), `font-sans antialiased` on `<body>`
- Headings: **Outfit** (500/600/700/800) via `--font-heading` (`font-heading` utility)
- Loaded from Google Fonts in `resources/views/app.blade.php`:
  `https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@500;600;700;800&display=swap`
- Scale is **small and dense**: most UI text is `text-xs` and `text-[10px]`–`text-[13px]`; page titles `text-xl`–`text-3xl`.
- Buttons: `text-xs font-semibold`. Primary wide CTA: `text-[11px] font-semibold uppercase tracking-[0.12em]`.
- Badges: `text-[10px] font-medium capitalize`.

## 5. Shape, borders, shadow

- Radius base `--radius: 0.625rem` (`lg`=10px, `md`=8px, `sm`=6px).
- **Cards / sections: `rounded-2xl`**; list rows & alerts: `rounded-xl`; buttons & inputs: `rounded-lg`; pills/chips/progress: `rounded-full`.
- Borders are always 1px, low-contrast sage (`#e9ebe5`). Dashed border (`#dfe4dc`) for empty states.
- Shadows: nearly flat. `shadow-[0_1px_2px_rgba(27,39,30,0.02)]` on cards, `shadow-2xs` on pills, `shadow-xl` only on drawers/modals.

## 6. Spacing & layout

- Card padding: `p-3.5 sm:p-4` (compact) or `p-4 sm:p-5` / `p-6` (roomy). Gaps `gap-2`–`gap-3`.
- Inputs/buttons height: `h-8` (small) / `h-9` (default). Inputs `px-3 text-xs`.
- Responsive pattern: stack on mobile, `sm:flex-row sm:items-center` for toolbars.
- App shell: collapsible **sidebar layout** (`layouts/app/app-sidebar-layout.tsx`) plus header layout alternative; breadcrumbs on top; auth layouts: simple, card, split.

## 7. Component recipes (copy these class strings)

**Primary button**
`h-9 rounded-lg bg-[#2b5139] px-4 text-xs font-semibold text-white hover:bg-[#203e2c] disabled:opacity-60 cursor-pointer`

**Small primary button**
`h-8 rounded-lg bg-[#2b5139] px-3.5 text-xs font-semibold text-white transition hover:bg-[#22422d] disabled:opacity-60`

**Outline / secondary button**
`inline-flex items-center gap-1 rounded-lg border border-[#e4e7e0] bg-white px-2.5 py-1 text-xs font-medium text-[#29382e] hover:bg-[#f6f8f4] cursor-pointer`

**Pill button / filter chip**
`inline-flex items-center gap-2.5 rounded-full border border-[#d6dfd3] bg-white px-3 py-1.5 text-xs font-semibold text-[#29382e] shadow-2xs transition hover:border-[#2b5139] disabled:cursor-not-allowed disabled:opacity-60`

**Icon button**
`rounded-lg p-1 text-[#838c81] hover:bg-[#f2f4f0] cursor-pointer`

**Card / section**
`rounded-2xl border border-[#e9ebe5] bg-white p-4 sm:p-5` (compact: `p-3.5 sm:p-4` + soft shadow)

**Toolbar / filter bar**
`flex flex-col justify-between gap-3 rounded-2xl border border-[#dfe5dd] bg-[#f9faf7] p-4 sm:flex-row sm:items-center`

**Clickable list row**
`flex w-full items-center justify-between gap-3 rounded-xl border border-[#eff0ec] p-3 text-left hover:bg-[#f8f9f6]`

**Text input**
`mt-1 h-9 w-full rounded-lg border border-[#e4e7e0] px-3 text-xs`

**Badge**
`rounded-full bg-[#f0f1ed] px-2 py-0.5 text-[10px] font-medium text-[#6d746a] capitalize`

**Progress bar**
track `h-2 overflow-hidden rounded-full bg-[#f0f1ed]`, fill `h-full rounded-full bg-[#69866c]`

**Toggle switch**
`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors` — on `bg-[#2b5139]`, off `bg-[#cbd2c9]`

**File input**
`text-xs text-[#526051] file:mr-3 file:rounded-lg file:border-0 file:bg-[#2b5139] file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white hover:file:bg-[#234530]`

**Empty state**
`rounded-2xl border border-dashed border-[#dfe4dc] bg-white p-8 text-center text-sm text-[#858b82]`

**Error panel**
`rounded-2xl border border-[#ecd8d2] bg-white p-6 text-sm text-[#8b4e43]`

**Warning notice**
`rounded-xl border border-amber-200/80 bg-amber-50/50 p-3 text-xs text-amber-900`

**Side drawer (detail/edit)**
Backdrop `fixed inset-0 z-50 flex justify-end bg-black/40`; panel `h-full w-full max-w-xl overflow-y-auto bg-white shadow-xl`; sticky header `sticky top-0 z-10 flex items-center justify-between border-b border-[#eff0ec] bg-white px-5 py-4`.

**Modal dialogs**: forms for create/edit (departments, programs, etc.) open in modals rather than inline panels.

**Custom scrollbar** (sidebar nav): 6px wide, rounded-full, sage thumb — see `.portal-sidebar-nav` in `app.css`.

## 8. Interaction & UX conventions

- Hover = subtle tint swap (`#f8f9f6` / `#f2f4f0`) or border darkens to brand green; no scale/animation effects.
- Disabled = `opacity-60`/`70` and `cursor-not-allowed`.
- Focus (shadcn components): 3px ring `ring-ring/50`.
- Feedback via `sonner` toasts; destructive actions go through a confirmation dialog (`components/confirmation-dialog.tsx`).
- Smooth scrolling with Lenis.
- Icons: lucide, `size-4` in buttons.
- Dark mode supported via `.dark` class + appearance tabs; custom sage screens are currently light-only (add `dark:` variants when reusing).

## 9. Reuse checklist for a new project

1. `laravel new` with the React (Inertia) starter kit, then `npm i` the packages in section 1.
2. Copy `resources/css/app.css`, `components.json`, `resources/js/components/ui/*`, `layouts/*`, shell components (`app-sidebar`, `app-header`, `nav-*`, `breadcrumbs`, `confirmation-dialog`, `heading`), `lib/utils.ts`, `hooks/*`.
3. Add the Inter + Outfit font links to `app.blade.php`.
4. Define brand tokens (section 3.1) in `@theme` and use them instead of raw hex.
5. Build new screens from the recipes in section 7; keep cards `rounded-2xl`, controls `rounded-lg`, text `text-xs`.
6. Keep pages small: split big files into reusable components (data table, stat card, modal form) rather than one monolithic page.

