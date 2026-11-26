import Link from "next/link";
import { notFound } from "next/navigation";
import { LuPlus } from "react-icons/lu";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/config";
import { withPageAccess } from "@/lib/server/auth/page-access";
import { getCustomerRequests } from "@/lib/server/requests/queries";
import { cairoDateString } from "@/lib/server/time/cairo";
import { requestEntry } from "./request-card";
import { RequestList } from "./request-list";
import styles from "./requests.module.css";

export default async function RequestsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const home = `/${locale}`;
  const path = `${home}/requests`;
  const planner = `${home}/plan`;
  const requests = await withPageAccess(locale, path, getCustomerRequests);
  const dictionary = await getDictionary(locale);
  const ar = locale === "ar";
  const t = (en: string, arabic: string) => ar ? arabic : en;
  const today = cairoDateString(new Date());
  const entries = requests.map((request) => requestEntry(request, locale, today));

  return (
    <main className={styles.portal}>
      <header className={styles.hero}>
        <div className={`${styles.wrap} ${styles.heroInner}`}>
          <div>
            <h1>{dictionary.myRequests}</h1>
            <p>{t("Review quotes and manage your bookings.", "راجعوا عروض الأسعار وأديروا حجوزاتكم.")}</p>
          </div>
          <Link className={styles.primary} href={planner} data-press>
            <LuPlus size={18} aria-hidden="true" />{t("New request", "طلب جديد")}
          </Link>
        </div>
      </header>
      <div className={`${styles.wrap} ${styles.workspace}`}>
        <RequestList entries={entries} locale={locale} emptyMessage={dictionary.noRequests} />
        {entries.length > 0 && (
          <details className={styles.support}>
            <summary>{t("Help with a request", "المساعدة بشأن طلب")}</summary>
            <p>{t("Open a confirmed booking to request a change. Include your request reference when contacting WANAS.",
              "افتحوا الحجز المؤكد لطلب تعديل. واذكروا الرقم المرجعي عند التواصل مع وناس.")}</p>
          </details>
        )}
      </div>
    </main>
  );
}
