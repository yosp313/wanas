import { notFound } from "next/navigation";
import { getCustomerRequest } from "@/lib/server/requests/queries";
import { isLocale } from "@/lib/i18n/config";
import { AcceptQuoteButton } from "@/components/requests/AcceptQuoteButton";
import { BookingChangeForm } from "@/components/requests/BookingChangeForm";

export default async function CustomerRequestPage({ params }: { params: Promise<{ locale: string; requestId: string }> }) {
  const { locale, requestId } = await params;
  if (!isLocale(locale)) notFound();
  const data = await getCustomerRequest(requestId);
  if (!data) notFound();
  return <main dir={locale === "ar" ? "rtl" : "ltr"}><h1>{data.request.customerName}</h1><p>{data.request.eventDate}</p><p>{data.request.status}</p><h2>Quotes</h2><ul>{data.quotes.map((quote) => <li key={quote.id}><span>{quote.offeredDate} · {quote.totalEgp} EGP · {quote.status}</span>{quote.status === "current" && <AcceptQuoteButton requestId={requestId} quoteId={quote.id} />}</li>)}</ul><h2>Bookings</h2><ul>{data.bookings.map((booking) => <li key={booking.id}>{booking.eventDate} · {booking.status}{booking.status === "confirmed" && <BookingChangeForm bookingId={booking.id} revision={booking.revision} />}<ul>{data.changes.filter((change) => change.bookingId === booking.id).map((change) => <li key={change.id}>{change.status} · {JSON.stringify(change.change)} · revision {change.revision}</li>)}</ul></li>)}</ul></main>;
}
