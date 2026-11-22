import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LuArrowLeft } from "react-icons/lu";
import { AcceptQuoteButton } from "@/components/requests/AcceptQuoteButton";
import { BookingChangeForm } from "@/components/requests/BookingChangeForm";
import { QuoteTerms } from "@/components/requests/QuoteTerms";
import { RequestLifecycleActions } from "@/components/requests/RequestLifecycleActions";
import { RequestScope } from "@/components/requests/RequestScope";
import { WanasWordmark } from "@/components/WanasWordmark";
import { isLocale } from "@/lib/i18n/config";
import type { RequestSnapshot } from "@/lib/planner/request-snapshot";
import { validInspirationLinks } from "@/lib/planner/validation";
import { withPageAccess } from "@/lib/server/auth/page-access";
import type { BookingChange } from "@/lib/server/bookings/actions";
import { getCustomerRequest } from "@/lib/server/requests/queries";
import styles from "./request-details.module.css";

const changeNames: Record<BookingChange["kind"], [string, string]> = {
  cancellation: ["Cancellation", "إلغاء"],
  reschedule: ["Reschedule", "تغيير الموعد"],
  scope: ["Scope or price change", "تغيير النطاق أو السعر"],
};

export default async function CustomerRequestPage({ params }: { params: Promise<{ locale: string; requestId: string }> }) {
  const { locale, requestId } = await params;
  if (!isLocale(locale)) notFound();
  const data = await withPageAccess(locale, `/${locale}/requests/${requestId}`, () => getCustomerRequest(requestId));
  if (!data) notFound();
  const ar = locale === "ar";
  const t = (en: string, arabic: string) => ar ? arabic : en;
  const { request, quotes, bookings } = data;
  const details = (request.details ?? {}) as Partial<RequestSnapshot>;
  const hasActivity = quotes.length > 0 || bookings.length > 0;
  const canWithdraw = request.status === "submitted" || request.status === "quoted";
  const status = bookings.some((booking) => booking.status === "confirmed") ? t("Booking confirmed", "تم تأكيد الحجز")
    : bookings.some((booking) => booking.status === "cancelled") ? t("Booking cancelled", "أُلغي الحجز")
    : request.status === "quoted" ? (quotes.some((quote) => quote.status === "current")
      ? t("Quote ready", "عرض السعر جاهز") : t("Quote expired", "انتهت صلاحية عرض السعر"))
    : request.status === "submitted" ? t("In review", "قيد المراجعة")
    : request.status === "withdrawn" ? t("Withdrawn", "مسحوب")
    : t("Closed", "مغلق");
  const venue = [details.venueName, details.streetAddress].filter(Boolean).join(" · ");
  const links = [...new Set(details.inspirationLinks?.trim().split(/\s+/).filter(Boolean))];
  const gallerySizes = hasActivity
    ? "(min-width: 1280px) 336px, (min-width: 1024px) 27vw, (min-width: 680px) 42vw, 85vw"
    : "(min-width: 1280px) 550px, (min-width: 680px) 42vw, 85vw";
  const inspiration = [
    {
      src: "/atelier/home/cloche.webp",
      caption: t("Atmosphere & table setting", "أجواء الحفل وتنسيق الطاولات"),
      alt: t("Candlelit table with white flowers and silver cloches", "طاولة على ضوء الشموع مع زهور بيضاء وأغطية فضية"),
    },
    {
      src: "/atelier/terracotta.webp",
      caption: t("Materials & florals", "الخامات وتنسيق الزهور"),
      alt: t("Terracotta vases, linen, and white flowers at an outdoor table", "مزهريات فخارية وكتان وزهور بيضاء على طاولة في الهواء الطلق"),
    },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.wrap}>
          <WanasWordmark locale={locale} />
          <span>{t("Concierge", "خدمة العملاء")}</span>
        </div>
      </header>

      <main className={styles.wrap}>
        <nav className={styles.back} aria-label={t("Breadcrumb", "مسار التنقل")}>
          <Link href={`/${locale}/requests`}><LuArrowLeft size={15} aria-hidden="true" />{t("My requests", "طلباتي")}</Link>
        </nav>

        <section className={styles.masthead} aria-labelledby="request-name">
          <div className={styles.mastheadHeading}>
            <div>
              <h1 id="request-name"><bdi>{request.customerName}</bdi></h1>
              <p>{t("Requested date", "تاريخ طلبك")} · <time dateTime={request.eventDate}>{request.eventDate}</time></p>
            </div>
            <p className={styles.status}>{status}</p>
          </div>
          <figure className={styles.venue}>
            <Image src="/atelier/home/courtyard.webp" alt="" fill loading="eager" sizes="(min-width: 1280px) 1232px, 100vw" />
            <figcaption>
              <span>{t("Venue inspiration", "إلهام للمكان")}</span>
              {venue && <strong><bdi>{venue}</bdi></strong>}
            </figcaption>
          </figure>
        </section>

        <div className={styles.columns} data-has-activity={hasActivity}>
          <section className={`${styles.card} ${styles.specifications}`}>
            <h2>{t("Event specifications", "تفاصيل المناسبة")}</h2>
            <RequestScope details={details} locale={locale} grouped />
            {canWithdraw && <div className={styles.actions}><RequestLifecycleActions requestId={requestId} locale={locale} /></div>}
          </section>

          <section className={styles.card}>
            <h2>{t("Visual direction & inspiration", "التوجه البصري والإلهام")}</h2>
            {links.length > 0 && (
              <div className={styles.links}>
                <h3>{t("Inspiration links", "روابط للإلهام")}</h3>
                <ul>
                  {links.map((link) => (
                    <li key={link}>
                      {validInspirationLinks(link)
                        ? <a href={link} target="_blank" rel="noopener noreferrer" dir="ltr">{link}</a>
                        : <bdi>{link}</bdi>}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className={styles.gallery}>
              {inspiration.map(({ src, caption, alt }) => (
                <figure key={src}>
                  <div><Image src={src} alt={alt} fill sizes={gallerySizes} /></div>
                  <figcaption>{caption}</figcaption>
                </figure>
              ))}
            </div>
          </section>

          {hasActivity && (
            <div className={styles.activity}>
              {quotes.length > 0 && (
                <section className={styles.card} id="quotes">
                  <h2>{t("Quotes", "عروض الأسعار")}</h2>
                  <ul className={styles.quotes}>
                    {quotes.map((quote) => (
                      <li key={quote.id}>
                        <QuoteTerms quote={quote} locale={locale} />
                        {quote.status === "current" && request.status === "quoted" && (
                          <div className={styles.actions}>
                            <AcceptQuoteButton requestId={requestId} quoteId={quote.id} locale={locale} />
                            <RequestLifecycleActions requestId={requestId} quoteId={quote.id} locale={locale} />
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {bookings.map((booking) => {
                const terms = booking.terms as { services?: unknown; totalEgp?: number } | null;
                const confirmed = booking.status === "confirmed";
                const changes = data.changes.filter((change) => change.bookingId === booking.id);
                return (
                  <section className={`${styles.card} ${styles.booking}`} key={booking.id} id={`booking-${booking.id}`}>
                    <h2>{confirmed ? t("Booking confirmed", "تم تأكيد الحجز") : t("Booking cancelled", "أُلغي الحجز")}</h2>
                    <div className={styles.bookingTerms}>
                      <p><time dateTime={booking.eventDate}>{booking.eventDate}</time></p>
                      {typeof terms?.services === "string" && <p dir="auto">{terms.services}</p>}
                      {typeof terms?.totalEgp === "number" && (
                        <p className={styles.total}><bdi>{new Intl.NumberFormat(locale, { style: "currency", currency: "EGP", numberingSystem: "latn" }).format(terms.totalEgp)}</bdi></p>
                      )}
                    </div>
                    {confirmed && <BookingChangeForm bookingId={booking.id} revision={booking.revision} locale={locale} />}
                    {changes.length > 0 && (
                      <ul className={styles.changes}>{changes.map((change) => {
                        const details = change.change as BookingChange;
                        return <li key={change.id}>{changeNames[details.kind][ar ? 1 : 0]} · {change.status === "applied" ?
                          t("Applied", "تم التطبيق") : t("Pending", "قيد المراجعة")} {details.newDate} {details.notes}</li>;
                      })}</ul>
                    )}
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
