import type { Locale } from "./config";
export function localizedPath(locale: Locale, pathname: string) { const clean = pathname.startsWith("/") ? pathname : `/${pathname}`; const withoutLocale = clean.replace(/^\/(ar|en)(?=\/|$)/, "") || "/"; return `/${locale}${withoutLocale === "/" ? "" : withoutLocale}`; }
