import Image from "next/image";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { safeReturnTo } from "@/lib/i18n/return-to";
import SignInForm from "./sign-in-form";

type SearchParams = Promise<{ returnTo?: string | string[]; error?: string }>;

async function SignIn({
  locale,
  searchParams,
}: {
  locale: Locale;
  searchParams: SearchParams;
}) {
  const { returnTo, error } = await searchParams;
  const destination = safeReturnTo(returnTo, locale);
  const { isAuthenticated } = await auth();
  if (isAuthenticated && !error) redirect(destination);
  return (
    <SignInForm locale={locale} returnTo={destination} callbackError={error} />
  );
}

export default async function SignInPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = await getDictionary(locale);
  return (
    <main className="shell sign-in-shell">
      <section className="sign-in-card">
        <div>

          <h1>{dictionary.signIn}</h1>
          <p>
            {locale === "ar"
              ? "سجّلوا الدخول لمتابعة طلبكم ومراجعة عروض الأسعار."
              : "Sign in to continue your request and review your quotes."}
          </p>
          <Suspense>
            <SignIn locale={locale} searchParams={searchParams} />
          </Suspense>
        </div>
        <div className="sign-in-photo">
          <Image
            src="/atelier/ivory.webp"
            alt=""
            fill
            sizes="(max-width: 700px) 95vw, 42vw"
          />
        </div>
      </section>
    </main>
  );
}
