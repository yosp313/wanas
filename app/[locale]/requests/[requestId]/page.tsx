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
import { withPageAccess } from "@/lib/server/auth/page-access";
import type { BookingChange } from "@/lib/server/bookings/actions";
import { getCustomerRequest } from "@/lib/server/requests/queries";

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
  const { request } = data;
  const canWithdraw = request.status === "submitted" || request.status === "quoted";
  return (
    <main className="shell">
      <Link href={`/${locale}/requests`}><LuArrowLeft size={16} aria-hidden="true" />{ar ? "طلباتي" : "My requests"}</Link>
      <section>
        <h1><bdi>{request.customerName}</bdi></h1>
        <p>{ar ? "تاريخ طلبك" : "Requested date"} · <time dateTime={request.eventDate}>{request.eventDate}</time></p>
        <RequestScope details={request.details as RequestSnapshot} locale={locale} />
        {canWithdraw && <RequestLifecycleActions requestId={requestId} locale={locale} />}
      </section>
      {data.quotes.length > 0 && (
        <section id="quotes">
          <h2>{ar ? "عروض الأسعار" : "Quotes"}</h2>
          <ul>{data.quotes.map((quote) => (
            <li key={quote.id}>
              <QuoteTerms quote={quote} locale={locale} />
              {quote.status === "current" && request.status === "quoted" && (
                <div>
                  <AcceptQuoteButton requestId={requestId} quoteId={quote.id} locale={locale} />
                  <RequestLifecycleActions requestId={requestId} quoteId={quote.id} locale={locale} />
                </div>
              )}
            </li>
          ))}</ul>
        </section>
      )}
      {data.bookings.map((booking) => {
        const terms = booking.terms as { services?: unknown; totalEgp?: number } | null;
        const confirmed = booking.status === "confirmed";
        const changes = data.changes.filter((change) => change.bookingId === booking.id);
        return (
          <section key={booking.id} id={`booking-${booking.id}`}>
            <h2>{confirmed ? (ar ? "تم تأكيد الحجز" : "Booking confirmed") : (ar ? "أُلغي الحجز" : "Booking cancelled")}</h2>
            <p><time dateTime={booking.eventDate}>{booking.eventDate}</time></p>
            {typeof terms?.services === "string" && <p>{terms.services}</p>}
            {typeof terms?.totalEgp === "number" && <p>{new Intl.NumberFormat(locale, { style: "currency", currency: "EGP", numberingSystem: "latn" }).format(terms.totalEgp)}</p>}
            {confirmed && <BookingChangeForm bookingId={booking.id} revision={booking.revision} locale={locale} />}
            {changes.length > 0 && (
              <ul>{changes.map((change) => {
                const details = change.change as BookingChange;
                return <li key={change.id}>{changeNames[details.kind][ar ? 1 : 0]} · {change.status === "applied" ?
                  (ar ? "تم التطبيق" : "Applied") : (ar ? "قيد المراجعة" : "Pending")} {details.newDate} {details.notes}</li>;
              })}</ul>
            )}
          </section>
        );
      })}
    </main>
  );
}
