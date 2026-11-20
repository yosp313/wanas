import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { withPageAccess } from "@/lib/server/auth/page-access";
import { getAdminInbox } from "@/lib/server/admin/queries";

export default async function AdminInboxPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ar = locale === "ar";
  const dictionary = await getDictionary(locale);
  const path = `/${locale}/admin/inbox`;
  const { requests, failures } = await withPageAccess(locale, path, getAdminInbox);
  return (
    <main className="shell">
      <nav aria-label={ar ? "الإدارة" : "Admin"}>
        <Link href={`/${locale}/admin/calendar`}>{ar ? "التقويم" : "Calendar"}</Link>
        <Link href={`/${locale}/admin/changes`}>{ar ? "طلبات التعديل" : "Booking changes"}</Link>
      </nav>
      <section>
        <h1>{dictionary.adminInbox}</h1>
        {requests.length === 0 ? <p>{dictionary.noRequests}</p> : (
          <ul>
            {requests.map((request) => (
              <li key={request.id}>
                <Link href={`/${locale}/admin/requests/${request.id}`}>{request.customerName}</Link>
                {" · "}<time dateTime={request.eventDate}>{request.eventDate}</time>
                {request.dateUnavailable && <strong> · {ar ? "التاريخ غير متاح" : "Date unavailable"}</strong>}
              </li>
            ))}
          </ul>
        )}
      </section>
      {failures.length > 0 && (
        <section>
          <h2>{ar ? "رسائل البريد التي تعذر إرسالها" : "Notification failures"}</h2>
          <ul>
            {failures.map((job) => (
              <li key={job.id}>
                {job.requestId && (
                  <Link href={`/${locale}/admin/requests/${job.requestId}`}>
                    {ar ? "عرض الطلب" : "Open request"}
                  </Link>
                )}{" "}
                <code>{job.kind} · {job.providerError ?? "unknown"}</code>
                {" · "}<time dateTime={job.updatedAt.toISOString()}>{job.updatedAt.toLocaleString(locale)}</time>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
