"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import { Suspense } from "react";
import { WanasWordmark } from "@/components/WanasWordmark";
import type { Locale } from "@/lib/i18n/config";
import LocaleSwitcher from "./locale-switcher";
import styles from "./site-navbar.module.css";

export function SiteNavbar({ locale, myRequests, switchLanguage }: {
  locale: Locale;
  myRequests: string;
  switchLanguage: string;
}) {
  const [segment, subpage] = useSelectedLayoutSegments();
  const home = `/${locale}`;
  const planner = `${home}/plan`;
  const requests = `${home}/requests`;
  const ar = locale === "ar";
  const navLabel = ar ? "التنقل الرئيسي" : "Main navigation";
  const language = <Suspense><LocaleSwitcher locale={locale} label={switchLanguage} /></Suspense>;

  if (segment === "admin") {
    return (
      <header className="locale-header">
        <WanasWordmark locale={locale} />
        <nav aria-label={navLabel}>
          <Link href={planner}>{ar ? "خططوا لحفلكم" : "Plan an event"}</Link>
          <Link href={requests}>{myRequests}</Link>
          {language}
          <UserButton />
        </nav>
      </header>
    );
  }

  return (
    <header className={styles.header} data-planner-page={segment === "plan" || undefined}>
      <div className={styles.inner}>
        <WanasWordmark locale={locale} />
        <nav className={styles.links} aria-label={navLabel}>
          <Link href={`${home}#ceremonies`}>{ar ? "المراسم" : "Ceremonies"}</Link>
          <Link href={planner} aria-current={segment === "plan" ? "page" : undefined}>
            {ar ? "مخطط المناسبات" : "Event planner"}
          </Link>
          <Link href={requests} aria-current={segment === "requests" ? (subpage ? "location" : "page") : undefined}>
            {myRequests}
          </Link>
          <Link href={`${segment === "requests" ? requests : home}#concierge`}>
            {ar ? "المساعدة" : "Help"}
          </Link>
        </nav>
        <div className={styles.account}>
          {language}
          <UserButton appearance={{ elements: { userButtonAvatarBox: { width: "2.125rem", height: "2.125rem" } } }} />
        </div>
      </div>
    </header>
  );
}
