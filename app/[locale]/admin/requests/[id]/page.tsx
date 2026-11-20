import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminRequestActions } from "@/components/admin/AdminRequestActions";
import { QuoteTerms } from "@/components/requests/QuoteTerms";
import { RequestScope } from "@/components/requests/RequestScope";
import { isLocale } from "@/lib/i18n/config";
import type { RequestSnapshot } from "@/lib/planner/request-snapshot";
import { getAdminRequest } from "@/lib/server/admin/queries";
import { withPageAccess } from "@/lib/server/auth/page-access";

export default async function AdminRequestPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const data = await withPageAccess(locale, `/${locale}/admin/requests/${id}`, () => getAdminRequest(id));
  if (!data) notFound();
  const ar = locale === "ar";
  const { request, quotes } = data;
  const previous = quotes.find((quote) => quote.status === "current");
  return (
    <main className="shell">
      <Link href={`/${locale}/admin/inbox`}>{ar ? "صندوق الطلبات" : "Request inbox"}</Link>
      <section>
        <h1>{request.customerName}</h1>
        <p><span dir="ltr">{request.customerEmail}</span> · <span dir="ltr">{request.customerMobile}</span></p>
        <p><time dateTime={request.eventDate}>{request.eventDate}</time></p>
        <p>{ar ? "لغة الطلب" : "Request language"} · {request.language === "ar" ? "العربية" : "English"}</p>
        <RequestScope details={request.details as RequestSnapshot} locale={locale} />
      </section>
      {quotes.length > 0 && (
        <section>
          <h2>{ar ? "عروض الأسعار" : "Quotes"}</h2>
          <ul>{quotes.map((quote) => <li key={quote.id}><QuoteTerms quote={quote} locale={locale} /></li>)}</ul>
        </section>
      )}
      {(request.status === "submitted" || request.status === "quoted") && (
        <AdminRequestActions
          requestId={id} locale={locale} eventDate={request.eventDate}
          previous={previous ? { ...previous, services: typeof previous.services === "string" ? previous.services : "" } : undefined}
        />
      )}
    </main>
  );
}
