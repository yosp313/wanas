"use client";

import { useParams } from "next/navigation";
import { PageNotFound } from "@/components/PageNotFound";
import { defaultLocale, isLocale } from "@/lib/i18n/config";

export default function NotFound() {
  const { locale } = useParams<{ locale: string }>();
  return <PageNotFound locale={isLocale(locale) ? locale : defaultLocale} />;
}
