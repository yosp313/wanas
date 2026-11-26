import Link from "next/link";
import { notFound } from "next/navigation";
import { LuArrowLeft } from "react-icons/lu";
import { AdminRequestActions } from "@/components/admin/AdminRequestActions";
import { QuoteTerms } from "@/components/requests/QuoteTerms";
import { RequestScope } from "@/components/requests/RequestScope";
import { isLocale } from "@/lib/i18n/config";
import type { RequestSnapshot } from "@/lib/planner/request-snapshot";
import { getAdminRequest } from "@/lib/server/admin/queries";
import { withPageAccess } from "@/lib/server/auth/page-access";
import styles from "../../calendar/calendar.module.css";

export default async function AdminRequestPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const data = await withPageAccess(locale, `/${locale}/admin/requests/${id}`, () => getAdminRequest(id));
  if (!data) notFound();
  const ar = locale === "ar";
  const { request, quotes } = data;
  const previous = quotes.find((quote) => quote.status === "current");
  return (
    <main className={`shell ${styles.requestDetail}`}>
      <Link href={`/${locale}/admin/inbox`}><LuArrowLeft size={16} aria-hidden="true" />{ar ? "صندوق الطلبات" : "Request inbox"}</Link>
      <header className={styles.requestHeader}>
        <div>
          <h1><bdi>{request.customerName}</bdi></h1>
          <p><bdi dir="ltr">{request.customerEmail}</bdi> · <bdi dir="ltr">{request.customerMobile}</bdi></p>
        </div>
        <div>
          <p>{ar ? "موعد المناسبة" : "Event date"} <time dateTime={request.eventDate}>{request.eventDate}</time></p>
          <p>{ar ? "لغة الطلب" : "Request language"} · {request.language === "ar" ? "العربية" : "English"}</p>
        </div>
      </header>
      <div className={styles.requestBody}>
        <section>
          <h2>{ar ? "تفاصيل المناسبة" : "Event brief"}</h2>
          <RequestScope details={request.details as RequestSnapshot} locale={locale} />
        </section>
        <div>
          {(request.status === "submitted" || request.status === "quoted") && (
            <AdminRequestActions
              requestId={id} locale={locale} eventDate={request.eventDate}
              previous={previous ? { ...previous, services: typeof previous.services === "string" ? previous.services : "" } : undefined}
            />
          )}
          {quotes.length > 0 && (
            <section>
              <h2>{ar ? "عروض الأسعار" : "Quotes"}</h2>
              <ul>{quotes.map((quote) => <li key={quote.id}><QuoteTerms quote={quote} locale={locale} /></li>)}</ul>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}
