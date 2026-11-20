import { notFound, redirect } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  redirect(`/${locale}/admin/inbox`);
}
