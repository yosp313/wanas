import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Suspense } from "react";
import { PageNotFound } from "@/components/PageNotFound";
import { defaultLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { SiteNavbar } from "./[locale]/site-navbar";
import "./globals.css";

export const metadata: Metadata = { title: "الصفحة غير موجودة | WANAS" };

export default async function GlobalNotFound() {
  const dictionary = await getDictionary(defaultLocale);
  const home = `/${defaultLocale}`;

  return (
    <html lang={defaultLocale} dir="rtl">
      <body>
        <ClerkProvider signInUrl={`${home}/sign-in`} signUpUrl={`${home}/sign-in`} afterSignOutUrl={home}>
          <Suspense>
            <SiteNavbar locale={defaultLocale} myRequests={dictionary.myRequests} switchLanguage={dictionary.switchLanguage} />
          </Suspense>
        </ClerkProvider>
        <PageNotFound locale={defaultLocale} />
      </body>
    </html>
  );
}
