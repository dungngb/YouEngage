"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { type Locale, type TranslationKey, DEFAULT_LOCALE, LOCALE_COOKIE } from "./shared";
import { vi } from "./vi";
import { en } from "./en";

const dictionaries: Record<Locale, Record<TranslationKey, string>> = { vi, en };

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  initialLocale,
  children,
}: {
  initialLocale: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    // Set cookie (expires in 1 year)
    document.cookie = `${LOCALE_COOKIE}=${newLocale};path=/;max-age=${365 * 24 * 60 * 60};samesite=lax`;
    // Reload to apply server-side translations
    window.location.reload();
  }, []);

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      const dict = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
      let value = dict[key] ?? key;
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          value = value.replace(`{${k}}`, String(v));
        }
      }
      return value;
    },
    [locale]
  );

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useLocale must be used within LocaleProvider");
  return ctx;
}
