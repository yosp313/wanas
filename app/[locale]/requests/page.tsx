import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LuPlus } from "react-icons/lu";
import { WanasWordmark } from "@/components/WanasWordmark";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/config";
import { withPageAccess } from "@/lib/server/auth/page-access";
import { getCustomerRequests } from "@/lib/server/requests/queries";
import { cairoDateString } from "@/lib/server/time/cairo";
import LocaleSwitcher from "../locale-switcher";
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
    <div className={styles.portal}>
      <header className={styles.header}>
        <div className={`${styles.wrap} ${styles.headerInner}`}>
          <WanasWordmark locale={locale} />
          <nav aria-label={t("Main navigation", "التنقل الرئيسي")}>
            <Link href={`${home}#ceremonies`}>{t("Ceremonies", "المراسم")}</Link>
            <Link href={planner}>{t("Event planner", "مخطط المناسبات")}</Link>
            <Link href={path} aria-current="page">{dictionary.myRequests}</Link>
            <a href="#concierge">{t("Help", "المساعدة")}</a>
          </nav>
          <div className={styles.account}>
            <Suspense><LocaleSwitcher locale={locale} label={dictionary.switchLanguage} /></Suspense>
            <UserButton />
          </div>
        </div>
      </header>

      <main>
        <section className={styles.hero}>
          <div className={`${styles.wrap} ${styles.heroInner}`}>
            <div>
              <h1>{dictionary.myRequests}</h1>
              <p>{t("Check your request status, review quotes, and request booking changes.",
                "تابعوا حالة طلباتكم وراجعوا عروض الأسعار واطلبوا تعديل الحجوزات.")}</p>
            </div>
            <Link className={styles.primary} href={planner} data-press>
              <LuPlus size={18} aria-hidden="true" />{t("New request", "طلب جديد")}
            </Link>
          </div>
        </section>

        <div className={`${styles.wrap} ${styles.workspace}`}>
          <RequestList entries={entries} locale={locale} emptyMessage={dictionary.noRequests} />
          <section className={styles.support} id="concierge">
            <div>
              <h2>{t("Help with a request", "المساعدة بشأن طلب")}</h2>
              <p>{t("Include your request reference when you contact WANAS.",
                "اذكروا الرقم المرجعي للطلب عند التواصل مع وناس.")}</p>
            </div>
            <dl>
              <div>
                <dt>{t("Request emails", "رسائل الطلب")}</dt>
                <dd>{t("See your WANAS emails", "راجعوا رسائل وناس")}</dd>
              </div>
              <div>
                <dt>{t("Booking changes", "تعديل الحجوزات")}</dt>
                <dd><a href="#request-list">{t("Open a booking", "افتحوا أحد الحجوزات")}</a></dd>
              </div>
              <div>
                <dt>{t("Location", "الموقع")}</dt>
                <dd>{t("Cairo, Egypt", "القاهرة، مصر")}</dd>
              </div>
            </dl>
          </section>
        </div>
      </main>

      <footer className={styles.footer}>
        <div className={`${styles.wrap} ${styles.footerInner}`}>
          <div>
            <WanasWordmark locale={locale} />
            <p>{t("Event decor in Cairo", "تصميم وتنسيق المناسبات في القاهرة")}</p>
          </div>
          <nav aria-label={t("WANAS links", "روابط وناس")}>
            <Link href={`${home}#ceremonies`}>{t("Ceremonies", "المراسم")}</Link>
            <Link href={planner}>{t("Event planner", "مخطط المناسبات")}</Link>
            <a href="#concierge">{t("Help", "المساعدة")}</a>
          </nav>
          <p>© WANAS Atelier</p>
        </div>
      </footer>
    </div>
  );
}
