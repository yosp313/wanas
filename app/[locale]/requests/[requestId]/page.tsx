import Link from "next/link";
import { notFound } from "next/navigation";
import { LuArrowLeft } from "react-icons/lu";
import { AcceptQuoteButton } from "@/components/requests/AcceptQuoteButton";
import { BookingChangeForm } from "@/components/requests/BookingChangeForm";
import { QuoteTerms } from "@/components/requests/QuoteTerms";
import { RequestLifecycleActions } from "@/components/requests/RequestLifecycleActions";
import { RequestScope } from "@/components/requests/RequestScope";
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
  const confirmed = bookings.some((booking) => booking.status === "confirmed");
  const status = confirmed ? t("Booking confirmed", "تم تأكيد الحجز")
    : bookings.some((booking) => booking.status === "cancelled") ? t("Booking cancelled", "أُلغي الحجز")
    : request.status === "quoted" ? (quotes.some((quote) => quote.status === "current")
      ? t("Quote ready", "عرض السعر جاهز") : t("Quote expired", "انتهت صلاحية عرض السعر"))
    : request.status === "submitted" ? t("In review", "قيد المراجعة")
    : request.status === "withdrawn" ? t("Withdrawn", "مسحوب")
    : t("Closed", "مغلق");
  const links = [...new Set(details.inspirationLinks?.trim().split(/\s+/).filter(Boolean))];
  const reference = `#${request.id.slice(0, 8).toUpperCase()}`;
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" })
    .format(new Date(request.eventDate + "T00:00:00Z"));

  return (
    <div className={styles.page}>
      <main className={styles.wrap}>
        <nav className={styles.back} aria-label={t("Breadcrumb", "مسار التنقل")}>
          <Link href={`/${locale}/requests`}><LuArrowLeft size={15} aria-hidden="true" />{t("My requests", "طلباتي")}</Link>
        </nav>

        <header className={styles.masthead}>
          <div>
            <p><bdi>{reference}</bdi></p>
            <h1><bdi>{request.customerName}</bdi></h1>
            <p>{t("Requested event date", "موعد المناسبة المطلوب")} <time dateTime={request.eventDate}>{date}</time></p>
          </div>
          <p className={styles.status} data-confirmed={confirmed || undefined}>{status}</p>
        </header>

        <div className={styles.columns} data-has-activity={hasActivity}>
          {hasActivity && (
            <div className={styles.activity}>
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
            </div>
          )}
          <section className={`${styles.card} ${styles.specifications}`} id="event-details">
            <h2>{t("Event specifications", "تفاصيل المناسبة")}</h2>
            <RequestScope details={details} locale={locale} grouped />
            {links.length > 0 && (
              <section className={styles.links} data-scope-group="links">
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
              </section>
            )}
            {canWithdraw && <div className={styles.actions}><RequestLifecycleActions requestId={requestId} locale={locale} /></div>}
          </section>
        </div>
      </main>
    </div>
  );
}
