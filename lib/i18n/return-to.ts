import type { Locale } from "./config";
export function safeReturnTo(value: string | undefined, locale: Locale) { if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return `/${locale}`; return value.startsWith(`/${locale}`) ? value : `/${locale}${value}`; }
