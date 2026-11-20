import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import LocaleSwitcher from "./locale-switcher";
import "../globals.css";
type Params = { params: Promise<{ locale: string }> };
export async function generateMetadata({ params }: Params): Promise<Metadata> { const { locale } = await params; if (!isLocale(locale)) notFound(); const dictionary = await getDictionary(locale); return { title: dictionary.title, description: dictionary.description }; }
export default async function LocaleLayout({ children, params }: Params & { children: ReactNode }) { const { locale } = await params; if (!isLocale(locale)) notFound(); const dictionary = await getDictionary(locale); return <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}><body><header className="locale-header"><strong>WANAS</strong><LocaleSwitcher locale={locale} label={dictionary.switchLanguage} /></header>{children}</body></html>; }
