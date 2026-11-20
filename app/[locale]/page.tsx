import { notFound } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/config";
import { Homepage } from "@/components/homepage/Homepage";
export default async function LocalizedHome({ params }: { params: Promise<{ locale: string }> }) { const { locale } = await params; if (!isLocale(locale)) notFound(); await getDictionary(locale); return <Homepage locale={locale} showNav={false} />; }
