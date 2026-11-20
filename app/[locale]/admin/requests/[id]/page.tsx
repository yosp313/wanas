import { notFound } from "next/navigation";
import { getAdminRequest } from "@/lib/server/admin/queries";
import { isLocale } from "@/lib/i18n/config";
import { AdminRequestActions } from "@/components/admin/AdminRequestActions";

export default async function AdminRequestPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const data = await getAdminRequest(id);
  if (!data) notFound();
  return <main dir={locale === "ar" ? "rtl" : "ltr"}>
    <h1>{data.request.customerName}</h1>
    <p>{data.request.customerEmail}</p><p>{data.request.customerMobile}</p>
    <p>{data.request.eventDate}</p>
    <dl>{Object.entries(data.request.details as Record<string, unknown>).map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{typeof value === "string" ? value : JSON.stringify(value)}</dd></div>)}</dl>
    <h2>Quotes</h2>
    <ul>{data.quotes.map((quote) => <li key={quote.id}>{quote.offeredDate} · {quote.totalEgp} EGP · {quote.status}</li>)}</ul>
    <AdminRequestActions requestId={id} />
  </main>;
}
