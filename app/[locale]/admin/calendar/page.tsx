import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminCalendar } from "@/lib/server/admin/calendar";
import { isLocale } from "@/lib/i18n/config";
import { withPageAccess } from "@/lib/server/auth/page-access";

const copy = { en: { title: "Calendar", previous: "Previous month", next: "Next month", show: "Show pending requests", hide: "Hide pending requests", confirmed: "Confirmed bookings", pending: "Pending requests", empty: "None" }, ar: { title: "التقويم", previous: "الشهر السابق", next: "الشهر التالي", show: "إظهار الطلبات المعلقة", hide: "إخفاء الطلبات المعلقة", confirmed: "الحجوزات المؤكدة", pending: "الطلبات المعلقة", empty: "لا يوجد" } } as const;

function shiftMonth(month: string, offset: number) { const [year, value] = month.split("-").map(Number); const date = new Date(Date.UTC(year, value - 1 + offset, 1)); return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`; }
function daysInMonth(month: string) { const [year, value] = month.split("-").map(Number); const count = new Date(Date.UTC(year, value, 0)).getUTCDate(); const leading = new Date(Date.UTC(year, value - 1, 1)).getUTCDay(); return [...Array(leading).fill(null), ...Array.from({ length: count }, (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`)]; }

export default async function AdminCalendarPage({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ month?: string; pending?: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const query = await searchParams;
  const month = query.month ?? new Date().toISOString().slice(0, 7);
  const includePending = query.pending === "1";
  const calendar = await withPageAccess(locale, `/${locale}/admin/calendar?month=${month}${includePending ? "&pending=1" : ""}`, () => getAdminCalendar(month, includePending));
  const text = copy[locale]; const confirmed = new Map(calendar.confirmed.map((booking) => [booking.eventDate, booking])); const pending = new Map(calendar.pending.map((request) => [request.eventDate, request])); const suffix = includePending ? "&pending=1" : "";
  return <main dir={locale === "ar" ? "rtl" : "ltr"}><h1>{text.title}</h1><nav aria-label={text.title}><Link href={`/${locale}/admin/calendar?month=${shiftMonth(month, -1)}${suffix}`}>{text.previous}</Link> <strong>{month}</strong> <Link href={`/${locale}/admin/calendar?month=${shiftMonth(month, 1)}${suffix}`}>{text.next}</Link></nav><p><Link href={`/${locale}/admin/calendar?month=${month}&pending=${includePending ? "0" : "1"}`}>{includePending ? text.hide : text.show}</Link></p><div role="grid" aria-label={month} style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: "0.5rem" }}>{daysInMonth(month).map((date, index) => date ? <div role="gridcell" key={date}><time dateTime={date}>{date.slice(-2)}</time>{confirmed.has(date) && <Link href={`/${locale}/admin/requests/${confirmed.get(date)!.requestId}`}> {text.confirmed}</Link>}{includePending && pending.has(date) && <Link href={`/${locale}/admin/requests/${pending.get(date)!.id}`}> {text.pending}</Link>}</div> : <div aria-hidden="true" key={`blank-${index}`} />)}</div><h2>{text.confirmed}</h2>{calendar.confirmed.length === 0 ? <p>{text.empty}</p> : <ul>{calendar.confirmed.map((booking) => <li key={booking.id}>{booking.eventDate} · <Link href={`/${locale}/admin/requests/${booking.requestId}`}>{booking.requestId}</Link></li>)}</ul>}{includePending && <><h2>{text.pending}</h2>{calendar.pending.length === 0 ? <p>{text.empty}</p> : <ul>{calendar.pending.map((request) => <li key={request.id}>{request.eventDate} · <Link href={`/${locale}/admin/requests/${request.id}`}>{request.customerName}</Link></li>)}</ul>}</>}</main>;
}
