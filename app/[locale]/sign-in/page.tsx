import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { LuArrowLeft, LuArrowRight } from "react-icons/lu";
import { WanasWordmark } from "@/components/WanasWordmark";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { safeReturnTo } from "@/lib/i18n/return-to";
import LocaleSwitcher from "../locale-switcher";
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
  const features = ar
    ? [
        ["الإلهام", "لوحات الأفكار وتنسيقات الزهور"],
        ["تخطيط الحفل", "تفاصيل المساحة والضيافة"],
        ["طلباتكم", "تابعوا طلباتكم وعروض الأسعار"],
      ]
    : [
        ["Inspiration", "Moodboards & floral palettes"],
        ["Event planning", "Venue & catering details"],
        ["Your requests", "Request updates & quotes"],
      ];

  return (
    <div className={styles.page} data-client-sign-in>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <nav aria-label={ar ? "روابط الأتيليه" : "Atelier navigation"}>
            <Link href={home}>
              <LuArrowLeft size={16} aria-hidden="true" className={styles.arrow} />{" "}
              {ar ? "العودة إلى الأتيليه" : "Back to Atelier"}
            </Link>
            <Link className={styles.studioLink} href={studio}>{ar ? "اكتشفوا الاستوديو" : "Explore Studio"}</Link>
          </nav>
          <WanasWordmark locale={locale} />
          <nav aria-label={ar ? "روابط الحساب" : "Account navigation"}>
            <span className={styles.current} aria-current="page">{dictionary.signIn}</span>
            <Link className={styles.headerPlan} href={plan}>{ar ? "خططوا لحفلكم" : "Plan an event"}</Link>
            <Suspense>
              <LocaleSwitcher locale={locale} label={dictionary.switchLanguage} />
            </Suspense>
            <UserButton />
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.intro}>
          <p className={styles.eyebrow}>{ar ? "بوابة عملاء الأتيليه" : "Private Client Suite · Atelier Access"}</p>
          <h1>
            {ar ? "مرحبًا بكم في " : "Welcome to Your "}
            <em>{ar ? "أتيليه وناس" : "Atelier Sanctuary"}</em>
          </h1>
          <p className={styles.description}>
            {ar
              ? "استكشفوا لوحات الأفكار وتنسيقات الزهور، وتابعوا تفاصيل حفلكم وعروض الأسعار."
              : "Explore ceremony moodboards and floral palettes, and sign in to follow your event requests and review your quotes."}
          </p>
          <Suspense fallback={<p className={styles.formCard} role="status">{ar ? "جارٍ تحميل تسجيل الدخول…" : "Loading sign-in…"}</p>}>
            <SignIn locale={locale} searchParams={searchParams} />
          </Suspense>
          <div className={styles.invitation}>
            <span>{ar ? "هل تخططون لحفل جديد؟" : "Planning your first celebration?"}</span>
            <Link href={plan}>
              {ar ? "ابدؤوا التخطيط" : "Start planning"}{" "}
              <LuArrowRight size={16} aria-hidden="true" className={styles.arrow} />
            </Link>
          </div>
          <div className={styles.help}>
            <div>
              <strong>{ar ? "تعرفوا على وناس" : "Meet the atelier"}</strong>
              <p>{ar ? "اكتشفوا كيف نصمم احتفالكم." : "See how we design your celebration."}</p>
            </div>
            <Link href={studio}>{ar ? "الاستوديو" : "Explore Studio"}</Link>
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
            <span className={styles.badge}>{ar ? "من أعمال الأتيليه" : "From the Atelier"}</span>
            <span className={styles.edition}>{ar ? "تصميم الاحتفالات" : "Celebrations & Spatial Design"}</span>
          </figcaption>
          <blockquote>
            {ar ? "«حيث تلتقي العمارة بالاحتفال.»" : "“Where architecture meets celebration in quiet, uncompromising opulence.”"}
          </blockquote>
          <dl className={styles.features}>
            {features.map(([title, description]) => (
              <div key={title}>
                <dt>{title}</dt>
                <dd>{description}</dd>
              </div>
            ))}
          </dl>
        </figure>
      </main>

      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div>
            <WanasWordmark locale={locale} />
            <p>{ar ? "تصميم الاحتفالات والمساحات بتفاصيل خاصة بكم" : "Bespoke celebration design & spatial storytelling"}</p>
          </div>
          <nav aria-label={ar ? "روابط وناس" : "WANAS links"}>
            <Link href={studio}>{ar ? "الاستوديو" : "Explore Studio"}</Link>
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
