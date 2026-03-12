"use client";

import { useLocale } from "@/i18n/locale-context";

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">{t("lang.switch")}</span>
      <div className="flex rounded-full border border-gray-200 bg-surface-muted text-xs">
        <button
          type="button"
          onClick={() => setLocale("vi")}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            locale === "vi"
              ? "bg-primary-600 text-white font-medium shadow-soft"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          VI
        </button>
        <button
          type="button"
          onClick={() => setLocale("en")}
          className={`rounded-full px-2.5 py-1 transition-colors ${
            locale === "en"
              ? "bg-primary-600 text-white font-medium shadow-soft"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          EN
        </button>
      </div>
    </div>
  );
}
