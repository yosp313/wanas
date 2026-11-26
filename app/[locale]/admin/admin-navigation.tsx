"use client";

import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { LuArrowUpRight } from "react-icons/lu";
import { WanasWordmark } from "@/components/WanasWordmark";
import type { Locale } from "@/lib/i18n/config";
import LocaleSwitcher from "../locale-switcher";
import { CalendarIcon } from "./calendar/icons";
import styles from "./calendar/calendar.module.css";

const sections = [
  { path: "inbox", en: "Requests inbox", ar: "الطلبات" },
  { path: "calendar", en: "Calendar", ar: "التقويم" },
  { path: "changes", en: "Booking changes", ar: "التعديلات" },
] as const;

export function AdminNavigation({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const prefix = `/${locale}/admin/`;
  const ar = locale === "ar";

  return (
    <header className={styles.navigation}>
      <div className={styles.brand}>
        <WanasWordmark locale={locale} />
        <small>{ar ? "إدارة وناس" : "WANAS admin"}</small>
      </div>
      <nav aria-label={ar ? "لوحة الإدارة" : "Admin workspace"}>
        {sections.map(({ path, ...label }) => {
          const href = prefix + path;
          const current = pathname === href;
          const active = path === "inbox" && pathname.startsWith(prefix + "requests/");
          return (
            <Link key={path} href={href} aria-current={current ? "page" : active ? "location" : undefined}>
              <CalendarIcon name={path} />{label[locale]}
            </Link>
          );
        })}
      </nav>
      <div className={styles.accountLinks}>
        <Link href={`/${locale}`}><LuArrowUpRight aria-hidden="true" />{ar ? "الموقع" : "Website"}</Link>
        <Suspense><LocaleSwitcher locale={locale} label={ar ? "English" : "العربية"} /></Suspense>
        <UserButton />
      </div>
    </header>
  );
}
