# Handoff — i18n Glossary Patch (2026-03-12)

## Summary

Vietnamese translations in `src/i18n/vi.ts` updated to match the newly agreed glossary. **No logic changes, no UI layout changes — text/i18n only.**

## Glossary Mappings Applied

| English Term | Old Vietnamese | New Vietnamese |
|---|---|---|
| Dashboard | Bảng điều khiển | Tổng quan |
| Findings | Phát hiện kiểm toán | Phát hiện |
| Engagements | Dự án kiểm toán | Cuộc Kiểm toán |
| Task | Nhiệm vụ | Công việc |
| Workpapers | Tài liệu làm việc | Hồ sơ |
| Signoff | Phê duyệt | Ký duyệt |
| Reviewer Signoff | Phê duyệt của Reviewer | Duyệt |
| Preparer Signoff | Xác nhận của Preparer | Xác nhận hoàn thành |
| Upload file | Tải lên tệp | Tải tài liệu lên |

## Files Changed

| File | Change |
|---|---|
| `src/i18n/vi.ts` | ~100+ string value updates (keys unchanged) |

## What Was NOT Changed

- `src/i18n/en.ts` — English translations unchanged
- `src/i18n/shared.ts` — No changes (TranslationKey type derived from vi.ts keys, keys unchanged)
- `src/i18n/index.ts` — No changes
- All component/page files — No changes (they reference keys, not values)
- All server actions — No changes
- No logic, no UI layout, no routing changes

## Verification

- **TypeScript check**: `npx tsc --noEmit` — 0 errors
- **Key integrity**: All translation keys preserved (only values changed)
- **Type safety**: `TranslationKey` type unchanged since keys are the same

## Spot-Check Points

- Sidebar nav labels: "Tổng quan", "Cuộc Kiểm toán", "Phát hiện", "Hồ sơ"
- Preparer signoff button: "Xác nhận hoàn thành"
- Reviewer signoff button: "Duyệt"
- Signoff section header: "Ký duyệt"
- Upload button: "Tải tài liệu lên"
- Task references: "Công việc"

## Risk Assessment

**Zero risk** — only `vi.ts` string values changed. No key renames, no structural changes, no logic changes. TypeScript compilation confirms type safety preserved.
