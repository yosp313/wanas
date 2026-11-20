import { Planner } from "@/components/planner/Planner";
import type { Locale } from "@/lib/catalog/catalog";

export default async function PlanPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: rawLocale } = await params;
  const locale: Locale = rawLocale === "en" ? "en" : "ar";
  return <Planner locale={locale} />;
}
