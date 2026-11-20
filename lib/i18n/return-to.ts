import type { Locale } from "./config";
import { localizedPath } from "./paths";

export function safeReturnTo(value: unknown, locale: Locale) {
  const fallback = `/${locale}`;
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || /[\\\p{Cc}]/u.test(value)) {
    return fallback;
  }

  const base = "https://wanas.invalid";
  const url = new URL(value, base);
  if (url.origin !== base) return fallback;
  return localizedPath(locale, url.pathname) + url.search + url.hash;
}
