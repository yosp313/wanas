import type { Metadata } from "next";
import { Suspense, type ReactNode } from "react";
import { ClerkProvider, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Toaster } from "sonner";
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
          <header className="locale-header">
            <Link className="brand-lockup" href={`/${locale}`}>
              <span>WANAS</span>
              <small>{locale === "ar" ? "أتيليه · القاهرة" : "Atelier · Cairo"}</small>
            </Link>
            <nav aria-label={locale === "ar" ? "التنقل الرئيسي" : "Main navigation"}>
              <Link href={`/${locale}/plan`}>
                {locale === "ar" ? "خططوا لحفلكم" : "Plan an event"}
              </Link>
              <Link href={`/${locale}/requests`}>{dictionary.myRequests}</Link>
              <Suspense>
                <LocaleSwitcher locale={locale} label={dictionary.switchLanguage} />
              </Suspense>
              <UserButton />
            </nav>
          </header>
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
            <Link className="brand-lockup" href={`/${locale}`}>
              <span>WANAS</span>
              <small>{locale === "ar" ? "القاهرة · مصر" : "Cairo · Egypt"}</small>
            </Link>
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
