import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";
import { getPendingBookingChanges } from "@/lib/server/admin/booking-changes";
import { ApplyBookingChangeForm } from "@/components/admin/ApplyBookingChangeForm";
import { withPageAccess } from "@/lib/server/auth/page-access";

export default async function AdminChangesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const changes: Awaited<ReturnType<typeof getPendingBookingChanges>> = await withPageAccess(locale, `/${locale}/admin/changes`, getPendingBookingChanges);
  return (
    <main className="shell" dir={locale === "ar" ? "rtl" : "ltr"}>
      <section>
        <h1>{locale === "ar" ? "تعديلات الحجوزات" : "Booking changes"}</h1>
        {changes.length === 0 ? <p>{locale === "ar" ? "لا توجد تعديلات معلقة." : "No pending changes."}</p> : (
          <ul className="change-list">{changes.map(({ change, booking, request, priorRevision }) => {
            const requested = change.change as { kind?: string; newDate?: string; notes?: string };
            return <li key={change.id}>

              <h2>{request.customerName}</h2>
              <p>{locale === "ar" ? "التاريخ المحجوز" : "Booked date"}: {booking.eventDate} · {locale === "ar" ? "الإصدار الحالي" : "Current revision"}: {booking.revision}</p>
              <p>{locale === "ar" ? "طلب العميل" : "Customer request"}: {requested.kind ?? "scope"}{requested.newDate ? ` · ${requested.newDate}` : ""}{requested.notes ? ` · ${requested.notes}` : ""}</p>
              <p>{locale === "ar" ? "الإصدار الذي راجعه العميل" : "Customer-seen revision"}: {change.revision}</p>
              <details><summary>{locale === "ar" ? "الشروط السابقة" : "Prior terms"}</summary><pre>{JSON.stringify(priorRevision?.terms ?? {}, null, 2)}</pre></details>
              <ApplyBookingChangeForm changeRequestId={change.id} revision={booking.revision} requestedRevision={change.revision} kind={requested.kind ?? "scope"} locale={locale} />
            </li>;
          })}</ul>
        )}
      </section>
    </main>
  );
}
