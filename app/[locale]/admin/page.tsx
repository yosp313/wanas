import { notFound } from "next/navigation";
import Link from "next/link";
import { getAdminInbox } from "@/lib/server/admin/queries";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/config";

export default async function AdminInboxPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = await getDictionary(locale);
  const requests = await getAdminInbox();
  return <main dir={locale === "ar" ? "rtl" : "ltr"}>
    <h1>{dictionary.adminInbox ?? "Request inbox"}</h1>
    {requests.length === 0 ? <p>{dictionary.noRequests ?? "No requests need action."}</p> : <ul>
      {requests.map((request) => <li key={request.id}>
        <Link href={`/${locale}/admin/requests/${request.id}`}>{request.customerName}</Link>
        <span>{request.eventDate}</span>
        <span>{request.status}</span>{request.dateUnavailable && <strong>Date unavailable</strong>}
      </li>)}
    </ul>}
  </main>;
}
