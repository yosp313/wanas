import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { LuArrowRight } from "react-icons/lu";
import { WanasWordmark } from "@/components/WanasWordmark";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { safeReturnTo } from "@/lib/i18n/return-to";
import SignInForm from "./sign-in-form";
import styles from "./sign-in.module.css";

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
  const ar = locale === "ar";
  const home = `/${locale}`;
  const studio = `${home}#studio`;
  const plan = `${home}/plan`;

  return (
    <div className={styles.page} data-client-sign-in>
      <main className={styles.main}>
        <section className={styles.intro}>
          <h1>{dictionary.signIn}</h1>
          <p className={styles.description}>
            {ar
              ? "سجّلوا الدخول لمتابعة طلباتكم ومراجعة عروض الأسعار."
              : "See your requests and review your quotes."}
          </p>
          <Suspense fallback={<p className={styles.formCard} role="status">{ar ? "جارٍ تحميل تسجيل الدخول…" : "Loading sign-in…"}</p>}>
            <SignIn locale={locale} searchParams={searchParams} />
          </Suspense>
          <div className={styles.invitation}>
            <span>{ar ? "هل تخططون لحفل جديد؟" : "Planning a new event?"}</span>
            <Link href={plan}>
              {ar ? "ابدؤوا التخطيط" : "Start planning"}{" "}
              <LuArrowRight size={16} aria-hidden="true" className={styles.arrow} />
            </Link>
          </div>
        </section>

        <figure className={styles.showcase}>
          <Image
            src="/atelier/ballroom.webp"
            alt=""
            fill
            loading="eager"
            sizes="(max-width: 640px) 94vw, (max-width: 959px) 608px, (min-width: 1280px) 560px, 44vw"
          />
          <figcaption>
            <span className={styles.edition}>{ar ? "ديكور قاعة أفراح" : "Ballroom decor"}</span>
          </figcaption>
        </figure>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div>
            <WanasWordmark locale={locale} />
            <p>{ar ? "ديكور المناسبات والضيافة في القاهرة" : "Event decor and catering in Cairo"}</p>
          </div>
          <nav aria-label={ar ? "روابط وناس" : "WANAS links"}>
            <Link href={studio}>{ar ? "طريقة التخطيط" : "How planning works"}</Link>
            <Link href={plan}>{ar ? "خططوا لحفلكم" : "Plan an event"}</Link>
            <Link href={`${home}/requests`}>{dictionary.myRequests}</Link>
          </nav>
          <div className={styles.footerNote}>
            <span>{ar ? "© أتيليه وناس. جميع الحقوق محفوظة." : "© WANAS Atelier. All rights reserved."}</span>
            <span>{ar ? "القاهرة · مصر" : "Cairo · Egypt"}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
