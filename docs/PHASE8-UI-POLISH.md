# Phase 8 — UI Polish + Bilingual i18n (VI/EN)

## Summary

Phase 8 eliminates all mixed Vietnamese/English text from the UI and implements a complete bilingual i18n system with Vietnamese as default and English as an option.

## Changes

### i18n Infrastructure
- `src/i18n/vi.ts` — Vietnamese dictionary (~300 keys, source of truth)
- `src/i18n/en.ts` — English dictionary (typed against vi.ts keys)
- `src/i18n/index.ts` — `getLocale()`, `getTranslator()`, `createTranslator()`, cookie helpers
- `src/i18n/locale-context.tsx` — `LocaleProvider` + `useLocale()` React hook

### Locale Management
- Cookie-based: `locale=vi|en`, 1-year expiry
- `LocaleProvider` wraps entire app in root layout
- `<html lang>` attribute reflects current locale
- Language switcher in sidebar footer

### Components Updated (Client)
| Component | Key Changes |
|-----------|-------------|
| `sidebar.tsx` | Nav labels, role badges, sign out button via `t()` |
| `language-switcher.tsx` | New — VI/EN toggle |
| `signoff-actions.tsx` | All labels, messages, toasts via `t()` |
| `status-transition.tsx` | Transition labels, rollback form via `t()` |
| `report-status-transition.tsx` | Status labels, confirm dialogs via `t()` |
| `finding-status-transition.tsx` | Status labels, close requirement via `t()` |
| `task-status-select.tsx` | Status options via `t()` |
| `team-manager.tsx` | Member form, role labels, toasts via `t()` |
| `file-upload.tsx` | Upload labels, size limit, toasts via `t()` |
| `form-submit.tsx` | Error fallback via `t()` |
| `delete-attachment-button.tsx` | Confirm, toasts via `t()` |
| `signoff-history.tsx` | Date locale |
| `error.tsx` (root + dashboard) | Error messages via `t()` |

### Pages Updated (Server)
| Page | Key Changes |
|------|-------------|
| Login | All labels via `t()` |
| Dashboard | Stats, sections, empty states via `t()` |
| Engagement list | Headers, empty state, card details via `t()` |
| Engagement detail | All sections, stats, empty states via `t()` |
| Task detail | Labels, status, attachments via `t()` |
| Report detail | Labels, status, locked notice via `t()` |
| Finding detail | Labels, status, close requirements via `t()` |
| Activity log | Heading, audit actions via `t()` |
| Documents | Search, filters, categories via `t()` |
| Global findings | Stats, labels via `t()` |
| Global reports | Labels via `t()` |
| New/Edit forms | All form labels, placeholders via `t()` |
| Not-found pages | Messages via `t()` |

### Server Actions Updated
| Action File | Changes |
|------------|---------|
| `task.ts` | All error messages via `t()` |
| `signoff.ts` | All error/validation messages via `t()` |
| `engagement.ts` | Gate errors, rollback, validation via `t()` |
| `report.ts` | Lock, gate, rollback errors via `t()` |
| `finding.ts` | Lock, close validation via `t()` |
| `authorization.ts` | Access denied messages via `t()` |

### API Routes Updated
| Route | Changes |
|-------|---------|
| `upload/route.ts` | File validation, lock, access errors via `t()` |
| `files/[id]/route.ts` | Access denied via `t()` |

### Date Formatting
- All `toLocaleDateString("vi-VN")` replaced with `toLocaleDateString(locale)`
- Locale sourced from `getLocale()` (server) or `useLocale().locale` (client)

## Verification
- TypeScript: 0 errors
- Hardcoded Vietnamese scan: only `vi.ts` and `constants.ts` (legacy, to be cleaned up)
- All translation keys typed — missing keys caught at compile time
