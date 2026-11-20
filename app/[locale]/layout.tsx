import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import LocaleSwitcher from "./locale-switcher";
import "../globals.css";

type Params = { params: Promise<{ locale: string }> };

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = await getDictionary(locale);
  return { title: dictionary.title, description: dictionary.description };
}

export default async function LocaleLayout({ children, params }: Params & { children: ReactNode }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = await getDictionary(locale);
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body>
        <header className="locale-header">
          <Link href={`/${locale}`}>WANAS</Link>
          <Link href={`/${locale}/requests`}>{dictionary.myRequests}</Link>
          <Suspense>
            <LocaleSwitcher locale={locale} label={dictionary.switchLanguage} />
          </Suspense>
        </header>
        {children}
      </body>
    </html>
  );
}
