import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import styles from "./route-state.module.css";

export function PageNotFound({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  return (
    <main className={styles.notFound}>
      <div>
        <p className={styles.code} aria-hidden="true">404</p>
        <h1>{ar ? "الصفحة غير موجودة" : "Page not found"}</h1>
        <p>{ar ? "ربما تغيّر الرابط أو حُذفت الصفحة." : "The link may have changed or the page may have been removed."}</p>
        <Link className="button" href={`/${locale}`}>
          {ar ? "العودة إلى الرئيسية" : "Back to home"}
        </Link>
      </div>
    </main>
  );
}
