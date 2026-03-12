import { cookies } from "next/headers";
import { DEFAULT_LOCALE, createTranslator, LOCALE_COOKIE } from "./shared";
import type { Locale, TranslationKey } from "./shared";

// Re-export shared types and utilities for server consumers
export type { Locale, TranslationKey };
export { DEFAULT_LOCALE, LOCALE_COOKIE, createTranslator, getDictionary } from "./shared";

/**
 * Get locale from cookie (server-side only).
 * Falls back to DEFAULT_LOCALE if cookie is missing or invalid.
 */
export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const raw = cookieStore.get(LOCALE_COOKIE)?.value;
  if (raw === "en" || raw === "vi") return raw;
  return DEFAULT_LOCALE;
}

/**
 * Shortcut: get translator for current request's locale (server components only).
 */
export async function getTranslator() {
  const locale = await getLocale();
  return createTranslator(locale);
}
