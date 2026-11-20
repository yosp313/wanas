import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerRequests } from "@/lib/server/requests/queries";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/config";

export default async function RequestsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const [dictionary, requests] = await Promise.all([getDictionary(locale), getCustomerRequests()]);
  return <main dir={locale === "ar" ? "rtl" : "ltr"}><h1>{dictionary.myRequests ?? "My requests"}</h1>{requests.length === 0 ? <p>{dictionary.noRequests ?? "No requests yet."}</p> : <ul>{requests.map((request) => <li key={request.id}><Link href={`/${locale}/requests/${request.id}`}>{request.eventDate}</Link> <span>{request.status}</span></li>)}</ul>}</main>;
}
