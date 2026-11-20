import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale, oppositeLocale } from "@/lib/i18n/config";
import { localizedPath } from "@/lib/i18n/paths";
export default async function LocalizedHome({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; if (!isLocale(locale)) notFound(); const dictionary = await getDictionary(locale); return <main className="shell"><nav><strong>WANAS</strong><Link href={localizedPath(oppositeLocale(locale), "/")}>{dictionary.switchLanguage}</Link></nav><section><p className="eyebrow">CAIRO · EVENTS</p><h1>{dictionary.title}</h1><p>{dictionary.description}</p><Link className="button" href={`/${locale}/plan`}>{dictionary.plan}</Link></section></main>; }
