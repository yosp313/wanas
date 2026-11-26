"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname, useSelectedLayoutSegments } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";
import { LuArrowUpRight, LuGlobe } from "react-icons/lu";
import { SocialIcons } from "@/components/SocialIcons";
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
  const sticky = usePathname() === home;
  const header = useRef<HTMLElement>(null);
  const ar = locale === "ar";

  useEffect(() => {
    const element = header.current;
    if (!sticky || !element) return;
    const root = document.documentElement;
    const updateOffset = () => root.style.setProperty("--site-header-height", `${element.offsetHeight}px`);
    updateOffset();
    const observer = new ResizeObserver(updateOffset);
    observer.observe(element);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--site-header-height");
    };
  }, [sticky]);

  if (segment === "admin") return null;

  return (
    <header ref={header} className={sticky ? `${styles.header} ${styles.sticky}` : styles.header}>
      <div className={styles.inner}>
        <div className="site-brand">
          <WanasWordmark locale={locale} />
          <SocialIcons />
        </div>
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
