# Phase 9 — Polish Changes Log

## Foundation

| File | Changes |
|------|---------|
| `tailwind.config.ts` | Added sea-blue `primary`, `accent` (citron), `surface` tokens, `rounded-card`, `shadow-soft/card/card-hover` |
| `src/app/globals.css` | Added component classes: `.card`, `.card-hover`, `.card-header`, `.card-title`, `.btn-*`, `.list-row`, `.page-*`, `.table-*`, `.badge`, global `focus-visible` ring |

## Core Components

| Component | Changes |
|-----------|---------|
| `status-badge.tsx` | Uses `.badge` class |
| `empty-state.tsx` | `rounded-card`, `bg-surface-muted`, `btn-primary btn-sm` |
| `sidebar.tsx` | `rounded-card` nav items, `bg-surface-hover`, `btn-secondary btn-sm` signout, `border-gray-200/80` |
| `language-switcher.tsx` | Pill toggle with `bg-surface-muted`, active `bg-primary-600 shadow-soft` |
| `signoff-actions.tsx` | `rounded-card` panels, `btn-primary/btn-secondary/btn-destructive btn-sm` buttons, `rounded-card` textareas |
| `signoff-history.tsx` | `rounded-card` cards |
| `file-upload.tsx` | `btn-secondary btn-sm` upload label |
| `delete-attachment-button.tsx` | `btn-ghost btn-xs` with red hover |
| `team-manager.tsx` | `list-row` members, `btn-primary/btn-secondary btn-sm`, `rounded-card` inputs, `bg-surface-muted` panel |
| `status-transition.tsx` | `btn-primary/btn-secondary btn-sm`, `rounded-card` rollback panel |
| `report-status-transition.tsx` | `btn-primary/btn-secondary btn-sm`, `rounded-card` rollback panel |
| `finding-status-transition.tsx` | `btn-primary/btn-secondary btn-sm` |
| `task-status-select.tsx` | `rounded-card`, `focus:ring-primary-400` |

## Pages

| Page | Changes |
|------|---------|
| `/login` | `bg-surface`, `.card shadow-card`, `btn-primary`, `rounded-card` inputs |
| `/dashboard` | `page-header/page-title/page-subtitle`, `.card` stat cards + sections, `card-header/card-title`, `.list-row`, stat card uppercase labels |
| `/dashboard` loading | `.card` skeleton, `rounded-card`, `bg-surface-muted` |
| `/dashboard` error | `btn-primary` retry button |
| `/dashboard` not-found | `btn-primary` back button |
| `/dashboard/engagements` | `page-header/page-title`, `.card card-hover`, `.badge` |
| `/dashboard/engagements/[id]` | `page-header/page-title`, `.card` sections, `card-header/card-title`, `.list-row`, `btn-primary/btn-secondary btn-sm` |
| `/dashboard/engagements/new` | `page-title`, `.card p-6` form, `rounded-card` inputs, `btn-primary/btn-secondary` |
| `/dashboard/engagements/[id]/edit` | Same as new |
| `/dashboard/engagements/[id]/tasks/[taskId]` | `.card p-6`, semantic `<nav>` breadcrumb, `card-title`, `list-row` attachments, uppercase labels |
| `/dashboard/engagements/[id]/tasks/new` | `.card p-6`, `rounded-card` inputs, `btn-primary/btn-secondary` |
| `/dashboard/engagements/[id]/findings/[findingId]` | `.card p-6`, breadcrumb, `card-title`, `list-row`, `btn-secondary` edit link |
| `/dashboard/engagements/[id]/findings/new` | `.card p-6`, `rounded-card`, `btn-primary/btn-secondary` |
| `/dashboard/engagements/[id]/reports/[reportId]` | `.card p-6`, breadcrumb, `card-title`, `list-row`, `rounded-card` lock notice |
| `/dashboard/engagements/[id]/reports/new` | `.card p-6`, `rounded-card`, `btn-primary/btn-secondary` |
| `/dashboard/engagements/[id]/activity` | `page-title`, `.card` log container |
| `/dashboard/documents` | `page-header/page-title`, `.card` filter, `.list-row`, `rounded-card` inputs, `btn-primary/btn-secondary btn-sm` |
| `/dashboard/findings` | `page-header/page-title`, `.card` stat cards + list, `.list-row` |
| `/dashboard/reports` | `page-header/page-title`, `.card`, `.list-row` |
| Root `error.tsx` | `bg-surface`, `btn-primary` |
| Root `not-found.tsx` | `bg-surface`, `btn-primary` |

## Not Changed (by design)

- No business logic, data fetching, authorization, workflow gates/locks
- No data model changes
- No new modules or features
- All text remains via i18n `t()` — no hardcoded strings
- Status color mappings in `constants.ts` unchanged
