import { Suspense, type ReactNode } from "react";
import { AdminNavigation } from "./admin-navigation";
import { RouteLoading } from "@/components/RouteLoading";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";

export default async function ProtectedLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <div className="admin-shell">
      <Suspense fallback={<RouteLoading />}>
        <AdminNavigation locale={locale} />
        {children}
      </Suspense>
    </div>
  );
}
