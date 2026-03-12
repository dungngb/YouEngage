# Handoff Report — Phase 8: UI Polish + Bilingual i18n (VI/EN)

**Date:** 2026-03-11
**Phase:** Phase 8 — UI Polish + Bilingual i18n

---

## Scope

Implement a complete bilingual i18n system (Vietnamese default, English optional) with key-based translations, cookie-based locale persistence, and eliminate all mixed-language hardcoded strings.

---

## Deliverables

### New Files
| File | Purpose |
|------|---------|
| `src/i18n/vi.ts` | Vietnamese translation dictionary (~300 keys) |
| `src/i18n/en.ts` | English translation dictionary (typed against vi.ts) |
| `src/i18n/index.ts` | Locale detection, translator factory, cookie helpers |
| `src/i18n/locale-context.tsx` | React context + `useLocale()` hook |
| `src/components/ui/language-switcher.tsx` | VI/EN toggle component |
| `docs/I18N-STRATEGY.md` | Architecture and conventions |
| `docs/PHASE8-UI-POLISH.md` | Detailed change log |
| `docs/HANDOFF-PHASE8.md` | This file |

### Modified Files (30+)
- All dashboard pages (server components)
- All client UI components (13 components)
- All server action files (6 files)
- Both API route files (upload, download)
- Root layout (`LocaleProvider` wrapper)
- Error and not-found pages

---

## Architecture Decisions

1. **Cookie-based locale** — readable by both server (Next.js `cookies()`) and client (`document.cookie`). No server-side session needed.

2. **Key-based dictionaries** — all strings referenced by key (`t("dashboard.title")`), not by content. TypeScript enforces key existence.

3. **`TranslationKey` type** derived from `vi.ts` — adding a key to `vi.ts` automatically makes it required in `en.ts`. Compile-time safety.

4. **Dynamic key pattern** — status/rating/category labels use `t(\`status.task.${status}\` as TranslationKey)` instead of separate label maps. The old `*_LABELS` constants in `constants.ts` are now legacy dead code.

5. **Page reload on locale switch** — simplest approach to re-render server components. The language switcher sets the cookie then calls `window.location.reload()`.

---

## Quality Checks

| Check | Result |
|-------|--------|
| TypeScript compilation | 0 errors |
| Hardcoded Vietnamese outside vi.ts | Only `constants.ts` (legacy) |
| Translation key coverage | ~300 keys across all UI |
| English translations complete | Yes, all keys matched |
| Date formatting locale-aware | Yes, all `toLocaleDateString(locale)` |
| Server action errors localized | Yes, via `getTranslator()` |
| API route errors localized | Yes, via `getTranslator()` |

---

## Known Limitations

1. **Legacy `constants.ts` label maps** — `ENGAGEMENT_STATUS_LABELS`, `TASK_STATUS_LABELS`, etc. are no longer used by the UI but are still exported. Can be removed in a future cleanup.

2. **Zod validation messages** — Schema-level validation messages (e.g., `z.string().min(1)`) use Zod defaults instead of i18n because schemas are defined at module scope (can't call async `getTranslator()`). The consumer pages provide their own `required` attributes for client-side validation.

3. **`assertManagerRole()`** — This sync utility function uses a plain English "Unauthorized" message because it can't call async `getTranslator()`. The error is typically caught and displayed by client-side toast with its own translated fallback.

4. **Signoff labels in `signoff-history.tsx`** — "Preparer Signoff", "Reviewer Approve", "Reviewer Reject" labels are kept in English as they are domain terms understood in both languages.

---

## Next Steps

1. **Phase 2 UAT Online** — deploy to Vercel + Neon, test with Azure AD SSO
2. **Language preference in user profile** — persist locale choice server-side (optional)
3. **Remove legacy label maps** from `constants.ts` (cleanup)
4. **RTL support** — not needed for VI/EN but architecture supports adding locales
