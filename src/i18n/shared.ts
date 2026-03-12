import { vi, type TranslationKey } from "./vi";
import { en } from "./en";

export type Locale = "vi" | "en";
export type { TranslationKey };

const dictionaries: Record<Locale, Record<TranslationKey, string>> = { vi, en };

export const DEFAULT_LOCALE: Locale = "vi";
export const LOCALE_COOKIE = "locale";

/**
 * Get the translation dictionary for a locale.
 */
export function getDictionary(locale: Locale): Record<TranslationKey, string> {
  return dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
}

/**
 * Create a translator function for a given locale.
 * Supports simple placeholder replacement: t("key", { count: 5 })
 */
export function createTranslator(locale: Locale) {
  const dict = getDictionary(locale);
  return function t(key: TranslationKey, params?: Record<string, string | number>): string {
    let value = dict[key] ?? key;
    if (params) {
      for (const [k, v] of Object.entries(params)) {
        value = value.replace(`{${k}}`, String(v));
      }
    }
    return value;
  };
}
