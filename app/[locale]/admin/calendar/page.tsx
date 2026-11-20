import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminCalendar } from "@/lib/server/admin/calendar";
import { isLocale } from "@/lib/i18n/config";

export default async function AdminCalendarPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ month?: string; pending?: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const query = await searchParams;
  const month = query.month ?? new Date().toISOString().slice(0, 7);
  const includePending = query.pending === "1";
  const calendar = await getAdminCalendar(month, includePending);
  return <main dir={locale === "ar" ? "rtl" : "ltr"}><h1>Calendar</h1><p>{month}</p><Link href={`/${locale}/admin/calendar?month=${month}&pending=${includePending ? "0" : "1"}`}>{includePending ? "Hide pending requests" : "Show pending requests"}</Link><h2>Confirmed bookings</h2><ul>{calendar.confirmed.map((booking) => <li key={booking.id}>{booking.eventDate} · <Link href={`/${locale}/admin/requests/${booking.requestId}`}>Open request</Link></li>)}</ul>{includePending && <><h2>Pending requests</h2><ul>{calendar.pending.map((request) => <li key={request.id}>{request.eventDate} · <Link href={`/${locale}/admin/requests/${request.id}`}>{request.customerName}</Link></li>)}</ul></>}</main>;
}
