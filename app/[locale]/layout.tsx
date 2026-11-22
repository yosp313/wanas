import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import Link from "next/link";
import { Toaster } from "sonner";
import { notFound } from "next/navigation";
import { WanasWordmark } from "@/components/WanasWordmark";
import { isLocale, locales } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { SiteNavbar } from "./site-navbar";
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

export default async function LocaleLayout({
  children,
  params,
}: Params & { children: ReactNode }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = await getDictionary(locale);
  return (
    <html lang={locale} dir={locale === "ar" ? "rtl" : "ltr"}>
      <body>
        <ClerkProvider signInUrl={`/${locale}/sign-in`} signUpUrl={`/${locale}/sign-in`} afterSignOutUrl={`/${locale}`}>
          <Suspense>
            <SiteNavbar locale={locale} myRequests={dictionary.myRequests} switchLanguage={dictionary.switchLanguage} />
          </Suspense>
          <Toaster
            dir={locale === "ar" ? "rtl" : "ltr"}
            position={locale === "ar" ? "bottom-left" : "bottom-right"}
            containerAriaLabel={locale === "ar" ? "الإشعارات" : "Notifications"}
            toastOptions={{ closeButtonAriaLabel: locale === "ar" ? "إغلاق الإشعار" : "Dismiss notification" }}
            richColors
            closeButton
          />
          {children}
          <footer className="atelier-footer">
            <WanasWordmark locale={locale} />
            <nav aria-label={locale === "ar" ? "روابط وناس" : "WANAS links"}>
              <Link href={`/${locale}/plan`}>
                {locale === "ar" ? "خططوا لحفلكم" : "Plan an event"}
              </Link>
              <Link href={`/${locale}/requests`}>{dictionary.myRequests}</Link>
            </nav>
          </footer>
        </ClerkProvider>
      </body>
    </html>
  );
}
