"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const workspace = sections.some(({ path }) => pathname === prefix + path);
  return (
    <nav
      className={workspace ? styles.navigation : "admin-nav"}
      aria-label={ar ? "لوحة الإدارة" : "Admin workspace"}
    >
      {workspace ? (
        <div className={styles.brand}>
          <bdi>WANAS <i aria-hidden="true">|</i> <em lang="ar">وَنَس</em></bdi>
          <small>{ar ? "إدارة الأتيليه" : "Atelier admin"}</small>
        </div>
      ) : <span>{ar ? "إدارة وناس" : "Wanas Studio"}</span>}
      {sections.map(({ path, ...label }) => {
        const href = prefix + path;
        const current = pathname === href;
        const active =
          current ||
          (path === "inbox" && pathname.startsWith(prefix + "requests/"));
        return (
          <Link
            key={path}
            href={href}
            aria-current={current ? "page" : active ? "location" : undefined}
          >
            {workspace && <CalendarIcon name={path} />}
            {!workspace && path === "inbox" && !ar ? "Request inbox" : label[locale]}
          </Link>
        );
      })}
      {workspace && (
        <div className={styles.sidebarFooter}>
          <Link href={`/${locale}`}>{ar ? "موقع وناس" : "WANAS website"}</Link>
          <LocaleSwitcher locale={locale} label={ar ? "English" : "العربية"} />
        </div>
      )}
    </nav>
  );
}
