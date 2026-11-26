"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { useSelectedLayoutSegments } from "next/navigation";
import { Suspense } from "react";
import { LuArrowUpRight, LuGlobe } from "react-icons/lu";
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
  const ar = locale === "ar";

  if (segment === "admin") return null;

  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <WanasWordmark locale={locale} />
        <nav className={styles.links} aria-label={ar ? "التنقل الرئيسي" : "Main navigation"}>
          <Link href={`${home}#ceremonies`}>{ar ? "المناسبات" : "Occasions"}</Link>
          <Link href={`${home}#studio`}>{ar ? "طريقة التخطيط" : "How it works"}</Link>
          <Link href={`${home}/requests`} aria-current={segment === "requests" ? (subpage ? "location" : "page") : undefined}>{myRequests}</Link>
        </nav>
        <div className={styles.account}>
          <span className={styles.language}>
            <LuGlobe size={16} aria-hidden="true" />
            <Suspense fallback={<span>{switchLanguage}</span>}><LocaleSwitcher locale={locale} label={switchLanguage} /></Suspense>
          </span>
          <UserButton appearance={{ elements: { userButtonAvatarBox: { width: "2.125rem", height: "2.125rem" } } }} />
          <Link className={styles.plan} href={`${home}/plan`} aria-current={segment === "plan" ? "page" : undefined}>
            {ar ? "مخطط المناسبات" : "Event planner"} <LuArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </header>
  );
}
