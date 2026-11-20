"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { oppositeLocale, type Locale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/paths";
export default function LocaleSwitcher({ locale, label }: { locale: Locale; label: string }) { const pathname = usePathname(); const query = useSearchParams().toString(); const target = `${localizedPath(oppositeLocale(locale), pathname)}${query ? `?${query}` : ""}`; return <Link href={target}>{label}</Link>; }
