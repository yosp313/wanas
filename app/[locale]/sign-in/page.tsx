import { Suspense } from "react";
import { notFound } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { safeReturnTo } from "@/lib/i18n/return-to";
import SignInForm from "./sign-in-form";

type SearchParams = Promise<{ returnTo?: string | string[] }>;

async function SignIn({ locale, searchParams }: { locale: Locale; searchParams: SearchParams }) {
  const { returnTo } = await searchParams;
  return <SignInForm locale={locale} returnTo={safeReturnTo(returnTo, locale)} />;
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
    <main className="shell">
      <section>
        <h1>{dictionary.signIn}</h1>
        <Suspense>
          <SignIn locale={locale} searchParams={searchParams} />
        </Suspense>
      </section>
    </main>
  );
}
