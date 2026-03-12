# I18N Strategy — YouEngage

## Architecture

### Design Principles
- **Single-language display** at a time (not mixed)
- **Vietnamese default** — cookie-based locale persistence
- **Key-based translation** — `t("key")` helper, no raw strings in components
- **Server + Client** — both can read locale from cookie

### File Structure
```
src/i18n/
├── vi.ts              # Vietnamese dictionary (source of truth for keys)
├── en.ts              # English dictionary (typed against vi.ts keys)
├── index.ts           # getLocale(), getTranslator(), createTranslator()
└── locale-context.tsx # React context + useLocale() hook for client components
```

### Locale Detection
1. Read `locale` cookie (via `next/headers` on server, `document.cookie` on client)
2. Valid values: `"vi"` | `"en"`
3. Fallback: `"vi"` (DEFAULT_LOCALE)
4. Cookie set by `LanguageSwitcher` component: `max-age=1year`, `samesite=lax`

### Translation Pattern

**Server Components (pages):**
```tsx
import { getTranslator, getLocale } from "@/i18n";
import type { TranslationKey } from "@/i18n";

export default async function Page() {
  const t = await getTranslator();
  const locale = await getLocale();

  return <h1>{t("dashboard.title")}</h1>;
}
```

**Client Components:**
```tsx
"use client";
import { useLocale } from "@/i18n/locale-context";
import type { TranslationKey } from "@/i18n";

export function MyComponent() {
  const { t, locale } = useLocale();

  return <span>{t("actions.save")}</span>;
}
```

**Dynamic keys (status labels):**
```tsx
// Instead of: ENGAGEMENT_STATUS_LABELS[status]
t(`status.engagement.${status}` as TranslationKey)

// Instead of: RISK_RATING_LABELS[rating]
t(`risk.${rating}` as TranslationKey)

// Instead of: AUDIT_ACTION_LABELS[action]
t(`audit.${action}` as TranslationKey)
```

**Parameterized messages:**
```tsx
t("error.gate.tasksNotApproved", { count: 3 })
// → "Còn 3 task chưa được duyệt (APPROVED)..."
```

### Translation Key Conventions
| Pattern | Example | Usage |
|---------|---------|-------|
| `nav.*` | `nav.dashboard` | Sidebar navigation |
| `role.*` | `role.manager` | Role labels |
| `status.{entity}.{STATUS}` | `status.task.APPROVED` | Status badges |
| `risk.{LEVEL}` | `risk.HIGH` | Risk rating labels |
| `taskType.{TYPE}` | `taskType.WORKPAPER` | Task type labels |
| `docCategory.{cat}` | `docCategory.evidence` | Document categories |
| `audit.{action}` | `audit.task.create` | Audit log action labels |
| `toast.*` | `toast.save.success` | Toast notifications |
| `error.*` | `error.taskLocked` | Server action errors |
| `error.gate.*` | `error.gate.missingScope` | Gate validation errors |
| `validation.*` | `validation.locked.reportIssued` | Validation errors |

### Language Switcher
- Located in sidebar footer (below navigation, above user info)
- Two-button toggle: `VI` | `EN`
- Active button highlighted with primary color
- Switches locale cookie + reloads page

### Date Formatting
- Uses `toLocaleDateString(locale)` / `toLocaleString(locale)`
- Locale passed from `getLocale()` (server) or `useLocale().locale` (client)

## Coverage
- **~300 translation keys** covering all UI text
- **30+ files updated** (pages, components, server actions, API routes)
- **Zero hardcoded Vietnamese** outside of `vi.ts` and legacy `constants.ts`
- Server action error messages are locale-aware
- API route error responses are locale-aware

## Adding New Translations
1. Add key + Vietnamese text to `src/i18n/vi.ts`
2. Add matching key + English text to `src/i18n/en.ts`
3. TypeScript will flag any missing keys (TranslationKey type)
4. Use `t("new.key")` in component
