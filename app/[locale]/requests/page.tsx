import Link from "next/link";
import { notFound } from "next/navigation";
import { getCustomerRequests } from "@/lib/server/requests/queries";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { isLocale } from "@/lib/i18n/config";
import { withPageAccess } from "@/lib/server/auth/page-access";

const statusLabels = {
  en: { submitted: "Submitted", quoted: "Quote ready", booked: "Booked", closed: "Closed" },
  ar: { submitted: "تم الإرسال", quoted: "العرض جاهز", booked: "تم الحجز", closed: "مغلق" },
} as const;

export default async function RequestsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dictionary = await getDictionary(locale);
  const requests = await withPageAccess(locale, `/${locale}/requests`, getCustomerRequests);
  return <main dir={locale === "ar" ? "rtl" : "ltr"}><h1>{dictionary.myRequests}</h1>{requests.length === 0 ? <p>{dictionary.noRequests}</p> : <ul>{requests.map((request) => <li key={request.id}><Link href={`/${locale}/requests/${request.id}`}>{request.eventDate}</Link> <span>{statusLabels[locale][request.status as keyof typeof statusLabels.en] ?? request.status}</span></li>)}</ul>}</main>;
}
