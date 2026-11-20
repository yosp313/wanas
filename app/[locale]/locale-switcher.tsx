"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { oppositeLocale, type Locale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/paths";
import { safeReturnTo } from "@/lib/i18n/return-to";

export default function LocaleSwitcher({ locale, label }: { locale: Locale; label: string }) {
  const pathname = usePathname();
  const query = new URLSearchParams(useSearchParams().toString());
  const targetLocale = oppositeLocale(locale);
  if (query.has("returnTo")) query.set("returnTo", safeReturnTo(query.get("returnTo"), targetLocale));
  const search = query.toString();
  const target = localizedPath(targetLocale, pathname) + (search ? `?${search}` : "");
  return <Link href={target} hrefLang={targetLocale} prefetch={false}>{label}</Link>;
}
