import { notFound } from "next/navigation";
import { Homepage } from "@/components/homepage/Homepage";
import { isLocale } from "@/lib/i18n/config";

export default async function LocalizedHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <Homepage locale={locale} />;
}
