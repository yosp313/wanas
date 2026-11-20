import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { safeReturnTo } from "@/lib/i18n/return-to";
import SignInForm from "./sign-in-form";
export default async function SignInPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ returnTo?: string }> }) { const { locale } = await params; if (!isLocale(locale)) notFound(); const dictionary = await getDictionary(locale); const query = await searchParams; return <main className="shell"><section><h1>{dictionary.signIn}</h1><SignInForm locale={locale} returnTo={safeReturnTo(query.returnTo, locale)} /></section></main>; }
