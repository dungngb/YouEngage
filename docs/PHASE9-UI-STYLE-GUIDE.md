# Phase 9 — UI Style Guide (Optro-inspired)

## Design Principles

- **Clean enterprise**: off-white background, white cards, subtle shadows
- **Consistency-first**: unified tokens for spacing, radius, colors, buttons, badges
- **Optro feel**: sea-blue primary, citron accent (sparingly), soft borders, clean typography

---

## Color Tokens

### Primary (Sea Blue)
| Token | Hex | Usage |
|-------|-----|-------|
| primary-50 | #f0f7ff | Active nav bg, role badge bg |
| primary-100 | #e0efff | Light highlight |
| primary-600 | #0070c7 | Buttons, links, active indicators |
| primary-700 | #005aa1 | Logo, hover states, strong text |

### Accent (Citron)
| Token | Hex | Usage |
|-------|-----|-------|
| accent-400 | #facc15 | Sparingly for indicators |
| accent-500 | #eab308 | Warning highlights |

*Citron is reserved for very specific indicators. Do not use broadly.*

### Surface
| Token | Value | Usage |
|-------|-------|-------|
| surface (DEFAULT) | #f8f9fb | Page background |
| surface-card | #ffffff | Card backgrounds |
| surface-muted | #f1f3f7 | Skeleton, muted areas |
| surface-hover | #f4f5f9 | Row/button hover states |

### Status Colors (unchanged, per constants.ts)
- Engagement: gray/blue/amber/purple/green
- Task: gray/blue/yellow/purple/green/red
- Finding: red/amber/blue/green
- Report: gray/amber/blue/green
- Risk: red/amber/green

---

## Radius

| Token | Value | Usage |
|-------|-------|-------|
| rounded-card | 14px (0.875rem) | Cards, panels, inputs, buttons |
| rounded-full | — | Badges, pills, avatars |

---

## Shadows

| Token | Value | Usage |
|-------|-------|-------|
| shadow-soft | 0 1px 3px rgba(0,0,0,0.04) | Default card shadow |
| shadow-card | 0 2px 8px rgba(0,0,0,0.06) | Hover/elevated card |
| shadow-card-hover | 0 4px 12px rgba(0,0,0,0.08) | Clickable card hover |

---

## Typography Hierarchy

| Element | Classes |
|---------|---------|
| Page title | `page-title` → text-2xl font-bold tracking-tight text-gray-900 |
| Page subtitle | `page-subtitle` → text-sm text-gray-500 |
| Card/section title | `card-title` → text-sm font-semibold tracking-tight text-gray-900 |
| Body text | text-sm text-gray-700 |
| Metadata | text-xs text-gray-400 |
| Label (uppercase) | text-xs font-medium uppercase tracking-wider text-gray-500 |

---

## Component Conventions

### Button

| Variant | Class | Usage |
|---------|-------|-------|
| Primary | `btn-primary` | Main CTA (Create, Submit, Confirm) |
| Secondary | `btn-secondary` | Cancel, Back, alternative actions |
| Ghost | `btn-ghost` | Subtle actions, nav-like buttons |
| Destructive | `btn-destructive` | Delete, Remove |

Size modifiers: `btn-sm` (compact), `btn-xs` (inline/icon)

### Badge

| Variant | Class | Usage |
|---------|-------|-------|
| Status | `badge` + color class | Task/engagement/finding status |
| Neutral | `badge-neutral` | Category labels, type labels |

### Card

| Class | Usage |
|-------|-------|
| `card` | Base card (border + bg + shadow + radius) |
| `card-hover` | Add hover shadow transition |
| `card p-5` or `card p-6` | Standard content card |
| `card-header` | Flex header with justify-between |
| `card-title` | Section title inside card |

### List Row

| Class | Usage |
|-------|-------|
| `list-row` | Clickable row with hover effect, border, padding |

### Table

| Class | Usage |
|-------|-------|
| `table-header` | TH cell styling |
| `table-cell` | TD cell styling |
| `table-row-hover` | TR hover effect |

### Empty State

Use `<EmptyState>` component with optional action button.

---

## Focus & Accessibility

- All interactive elements: `focus-visible:ring-2 ring-primary-400/50 ring-offset-2`
- Defined globally in `globals.css` via `*:focus-visible`
- Disabled states: `disabled:opacity-50 disabled:pointer-events-none`
- Hover transitions: `transition-colors duration-150`

---

## Spacing

- Page sections: `space-y-6`
- Card padding: `p-5` (compact) or `p-6` (detail/form)
- List items: `space-y-1.5` (tight) or `space-y-2` (standard)
- Form fields: `space-y-5`

---

## Files

- `tailwind.config.ts` — tokens (colors, radius, shadows)
- `src/app/globals.css` — component classes (card, btn-*, list-row, etc.)
