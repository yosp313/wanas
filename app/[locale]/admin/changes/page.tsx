import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getPendingBookingChanges } from "@/lib/server/admin/booking-changes";
import { ApplyBookingChangeForm } from "@/components/admin/ApplyBookingChangeForm";

export default async function AdminChangesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const changes = await getPendingBookingChanges();
  return <main dir={locale === "ar" ? "rtl" : "ltr"}><h1>Booking changes</h1>{changes.length === 0 ? <p>No pending changes.</p> : <ul>{changes.map(({ change, booking, request }) => <li key={change.id}><h2>{request.customerName}</h2><p>{change.change ? JSON.stringify(change.change) : ""} · booking {booking.eventDate} · revision {booking.revision}</p><ApplyBookingChangeForm changeRequestId={change.id} revision={booking.revision} kind={(change.change as { kind?: string }).kind ?? "scope"} /></li>)}</ul>}</main>;
}
