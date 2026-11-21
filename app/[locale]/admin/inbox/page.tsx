import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { withPageAccess } from "@/lib/server/auth/page-access";
import { getAdminInbox } from "@/lib/server/admin/queries";

export default async function AdminInboxPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ar = locale === "ar";
  const dictionary = await getDictionary(locale);
  const path = `/${locale}/admin/inbox`;
  const { requests, failures } = await withPageAccess(
    locale,
    path,
    getAdminInbox,
  );
  return (
    <main className="shell">
      <section>
        <h1>{dictionary.adminInbox}</h1>
        {requests.length === 0 ? (
          <p>{dictionary.noRequests}</p>
        ) : (
          <ul className="request-list">
            {requests.map((request) => (
              <li key={request.id}>
                <div>
                  <Link href={`/${locale}/admin/requests/${request.id}`}>
                    <bdi>{request.customerName}</bdi>
                  </Link>
                  <time dateTime={request.eventDate}>{request.eventDate}</time>
                </div>
                {request.dateUnavailable && (
                  <strong className="status status-unavailable">
                    {ar ? "التاريخ غير متاح" : "Date unavailable"}
                  </strong>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
      {failures.length > 0 && (
        <section>
          <h2>
            {ar ? "رسائل البريد التي تعذر إرسالها" : "Notification failures"}
          </h2>
          <ul>
            {failures.map((job) => (
              <li key={job.id}>
                {job.requestId && (
                  <Link href={`/${locale}/admin/requests/${job.requestId}`}>
                    {ar ? "عرض الطلب" : "Open request"}
                  </Link>
                )}{" "}
                <code>
                  {job.kind} · {job.providerError ?? "unknown"}
                </code>
                {" · "}
                <time dateTime={job.updatedAt.toISOString()}>
                  {job.updatedAt.toLocaleString(locale, { numberingSystem: "latn" })}
                </time>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
