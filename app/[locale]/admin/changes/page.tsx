import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { LuArrowRight } from "react-icons/lu";
import { ApplyBookingChangeForm } from "@/components/admin/ApplyBookingChangeForm";
import { catalogLabel } from "@/lib/catalog/catalog";
import { isLocale, type Locale } from "@/lib/i18n/config";
import type { RequestSnapshot } from "@/lib/planner/request-snapshot";
import { getAdminBookingChanges } from "@/lib/server/admin/booking-changes";
import { withPageAccess } from "@/lib/server/auth/page-access";
import type { BookingChange } from "@/lib/server/bookings/actions";
import { CAIRO_TIME_ZONE, cairoDateString } from "@/lib/server/time/cairo";
import calendar from "../calendar/calendar.module.css";
import { startOfWeek } from "../calendar/dates";
import { CalendarIcon } from "../calendar/icons";
import { ChangeCard } from "./change-card";
import styles from "./changes.module.css";

const filters = ["all", "pending", "applied", "declined"] as const;
const moodboardImages = new Map([
  ["sunlit-terracotta", "terracotta"], ["quiet-olive", "greenhouse"],
  ["ivory-garden", "ivory"], ["midnight-candlelight", "emerald"],
]);

type Query = Promise<Record<string, string | string[] | undefined>>;
type Terms = { services?: string; totalEgp?: number; scopeExplanation?: string };

export default async function AdminChangesPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Query;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <Suspense fallback={<main className={calendar.loading} aria-busy="true">{locale === "ar" ? "جارٍ تحميل التعديلات…" : "Loading booking changes…"}</main>}>
      <BookingChanges locale={locale} searchParams={searchParams} />
    </Suspense>
  );
}

async function BookingChanges({ locale, searchParams }: { locale: Locale; searchParams: Query }) {
  const ar = locale === "ar";
  const query = await searchParams;
  const path = `/${locale}/admin/changes`;
  const status = filters.find((filter) => filter === query.status) ?? "pending";
  const search = typeof query.q === "string" ? query.q.trim().slice(0, 200) : "";
  const sort = query.sort === "oldest" ? "oldest" : "newest";
  const searchLabel = ar ? "ابحث عن تعديل أو عميل" : "Search changes or clients";
  const sortLabel = ar ? "ترتيب التعديلات" : "Sort changes";

  function href(filter: typeof status) {
    return `${path}?${new URLSearchParams({ status: filter, q: search, sort })}`;
  }

  const rows = await withPageAccess(locale, href(status), getAdminBookingChanges);
  const number = new Intl.NumberFormat(locale);
  const currency = new Intl.NumberFormat(ar ? "ar-EG" : "en-EG", {
    style: "currency", currency: "EGP", maximumFractionDigits: 0,
  });
  const signedCurrency = new Intl.NumberFormat(ar ? "ar-EG" : "en-EG", {
    style: "currency", currency: "EGP", maximumFractionDigits: 0, signDisplay: "exceptZero",
  });
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
  const timestamp = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone: CAIRO_TIME_ZONE });
  const relative = new Intl.RelativeTimeFormat(locale, { numeric: "always" });
  const now = new Date();
  const weekStart = startOfWeek(cairoDateString(now));
  const labels = ar
    ? { all: "كل التعديلات", pending: "بانتظار المراجعة", applied: "تمت الموافقة", declined: "مرفوض" }
    : { all: "All changes", pending: "Pending review", applied: "Approved", declined: "Declined" };
  const kinds = ar
    ? { scope: "تعديل النطاق", reschedule: "تغيير الموعد", cancellation: "إلغاء الحجز" }
    : { scope: "Scope change", reschedule: "Reschedule", cancellation: "Cancellation" };
  const counts = { all: rows.length, pending: 0, applied: 0, declined: 0 };
  const cards = rows.map(({ change, booking, request, before, applied, seen }) => {
    if (change.status === "pending" || change.status === "applied" || change.status === "declined") counts[change.status]++;
    const requested = change.change as Partial<BookingChange> | null;
    const kind = requested?.kind ?? "scope";
    const details = request.details as Partial<RequestSnapshot> | null;
    const title = details?.eventTypeOther || details?.catalogLabels?.eventType?.[locale] ||
      catalogLabel("eventTypes", details?.eventType ?? "", locale) || (ar ? "حجز مناسبة" : "Event booking");
    const prior = before?.terms as Terms | null | undefined;
    const agreement = applied?.terms as Terms | null | undefined;
    const currentTotal = typeof prior?.totalEgp === "number" ? prior.totalEgp : undefined;
    const agreedTotal = typeof agreement?.totalEgp === "number" ? agreement.totalEgp : undefined;
    const delta = kind !== "cancellation" && currentTotal !== undefined && agreedTotal !== undefined
      ? agreedTotal - currentTotal : undefined;
    return { change, booking, request, before, seen, requested, kind, title, prior, agreement, currentTotal, agreedTotal, delta, image: moodboardImages.get(details?.moodboard ?? "") };
  });
  const oldestPending = cards.findLast(({ change }) => change.status === "pending");
  const approvedThisWeek = cards.filter(({ change }) =>
    change.status === "applied" && cairoDateString(change.updatedAt) >= weekStart,
  ).length;
  const impacts = cards.flatMap(({ delta }) => delta === undefined ? [] : [delta]);
  const term = search.toLocaleLowerCase(locale);
  const visible = cards.filter(({ change, request, title, kind }) =>
    (status === "all" || change.status === status) &&
    [request.customerName, request.customerEmail, request.id, change.id, title, kinds[kind]]
      .some((value) => value?.toLocaleLowerCase(locale).includes(term)),
  );
  if (sort === "oldest") visible.reverse();
  const firstPendingId = visible.find(({ change }) => change.status === "pending")?.change.id;

  function age(createdAt: Date) {
    const minutes = Math.max(0, Math.floor((now.getTime() - createdAt.getTime()) / 60_000));
    if (minutes >= 1440) return relative.format(-Math.floor(minutes / 1440), "day");
    if (minutes >= 60) return relative.format(-Math.floor(minutes / 60), "hour");
    return minutes ? relative.format(-minutes, "minute") : (ar ? "الآن" : "just now");
  }

  function eventDate(value: string) {
    return <time dateTime={value}>{date.format(new Date(value + "T00:00:00Z"))}</time>;
  }

  return (
    <main className={styles.workspace}>
      <header className={`${calendar.header} ${styles.header}`}>
        <form action={path} className={calendar.search} role="search" key={search}>
          <input type="hidden" name="status" value={status} />
          <input type="hidden" name="sort" value={sort} />
          <button type="submit" aria-label={searchLabel}><CalendarIcon name="search" /></button>
          <input type="search" name="q" aria-label={searchLabel} placeholder={searchLabel + "…"} defaultValue={search} maxLength={200} />
        </form>
        <UserButton />
      </header>

      <div className={styles.content}>
        <div className={styles.title}>
          <h1>{ar ? "تعديلات الحجوزات" : "Booking Changes"}</h1>
          <p>{ar ? "راجع طلبات العملاء لتعديل الحجوزات، وحدّث المواعيد والنطاق والتكاليف المتفق عليها." : "Review client requests and update booking dates, scope, and agreed costs."}</p>
        </div>

        <dl className={styles.stats}>
          <div>
            <dt>{ar ? "طلبات التعديل المعلقة" : "Pending change requests"} <CalendarIcon name="pending" /></dt>
            <dd>{number.format(counts.pending)}</dd>
            <p>{oldestPending
              ? <>{ar ? "أُرسل أقدم طلب" : "Oldest request submitted"} <strong>{age(oldestPending.change.createdAt)}</strong></>
              : (ar ? "لا توجد طلبات بانتظار المراجعة." : "No requests awaiting review.")}</p>
          </div>
          <div>
            <dt>{ar ? "الموافقات هذا الأسبوع" : "Approved this week"} <CalendarIcon name="check" /></dt>
            <dd>{number.format(approvedThisWeek)}</dd>
            <p>{ar ? "حسب توقيت القاهرة" : "Cairo time"}</p>
          </div>
          <div>
            <dt>{ar ? "متوسط أثر التعديل على التكلفة" : "Average budget impact"} <CalendarIcon name="trend" /></dt>
            <dd><bdi>{impacts.length ? signedCurrency.format(impacts.reduce((sum, delta) => sum + delta, 0) / impacts.length) : "—"}</bdi></dd>
            <p>{ar ? "التعديلات المعتمدة ذات الإجماليات المسجلة" : "Approved changes with recorded totals"}</p>
          </div>
        </dl>

        <div className={styles.filters}>
          <nav aria-label={ar ? "حالة التعديل" : "Change status"}>
            {filters.map((filter) => (
              <Link key={filter} href={href(filter)} aria-current={status === filter ? "page" : undefined} scroll={false}>
                {labels[filter]} <span>({number.format(counts[filter])})</span>
              </Link>
            ))}
          </nav>
          <form className={styles.sort} action={path} key={sort}>
            <input type="hidden" name="status" value={status} />
            {search && <input type="hidden" name="q" value={search} />}
            <CalendarIcon name="sort" />
            <select aria-label={sortLabel} name="sort" defaultValue={sort}>
              <option value="newest">{ar ? "الأحدث أولاً" : "Most recent"}</option>
              <option value="oldest">{ar ? "الأقدم أولاً" : "Oldest first"}</option>
            </select>
            <button type="submit">{ar ? "ترتيب" : "Sort"}</button>
          </form>
        </div>

        {visible.length ? (
          <div className={styles.ledger} key={href(status)}>
            {visible.map(({ change, booking, request, before, seen, requested, kind, title, prior, agreement, currentTotal, agreedTotal, delta, image }) => {
              const pending = change.status === "pending";
              const previousDate = before?.eventDate ?? seen?.eventDate ?? (pending ? booking.eventDate : undefined);
              const statusLabel = change.status === "applied" || change.status === "declined" ? labels[change.status] : pending ? labels.pending : change.status;
              const priorScope = typeof prior?.scopeExplanation === "string" ? prior.scopeExplanation : "";
              const appliedScope = typeof agreement?.scopeExplanation === "string" ? agreement.scopeExplanation : "";
              return (
                <ChangeCard
                  key={change.id}
                  initialOpen={change.id === firstPendingId}
                  reviewLabel={pending ? (ar ? "مراجعة التعديل" : "Review change") : (ar ? "عرض التفاصيل" : "View details")}
                  requestUrl={`/${locale}/admin/requests/${request.id}`}
                  requestLabel={ar ? "فتح الطلب" : "Open request"}
                  summary={<>
                    <div className={styles.identity}>
                      <div className={styles.badges}>
                        <span className={styles.status} data-status={change.status}>{statusLabel}</span>
                        <span>{kinds[kind] ?? kinds.scope}</span>
                      </div>
                      <p><time title={timestamp.format(change.createdAt)} dateTime={change.createdAt.toISOString()}>{ar ? "أُرسل" : "Requested"} {age(change.createdAt)}</time></p>
                      <h2><bdi>{title}</bdi></h2>
                      <p><strong><bdi>{request.customerName}</bdi></strong>{previousDate && <> · {eventDate(previousDate)}</>}</p>
                    </div>
                    <div className={styles.comparison}>
                      <div className={styles.change}>
                        {kind === "reschedule" && requested?.newDate ? (
                          <>{previousDate && <><del>{eventDate(previousDate)}</del><LuArrowRight size={16} aria-hidden="true" className={styles.dateArrow} /></>}<strong>{eventDate(requested.newDate)}</strong></>
                        ) : kind === "cancellation" && previousDate ? <del>{eventDate(previousDate)}</del> : (ar ? "نطاق المناسبة" : "Event scope")}
                      </div>
                      {delta !== undefined ? (
                        <bdi className={styles.amount} data-negative={delta < 0}>{signedCurrency.format(delta)}</bdi>
                      ) : pending && currentTotal !== undefined && (
                        <span className={styles.currentTotal}>{ar ? "الإجمالي الحالي" : "Current total"} <bdi>{currency.format(currentTotal)}</bdi></span>
                      )}
                    </div>
                  </>}
                >
                    <section className={styles.terms}>
                      <h3>{pending ? (ar ? "الشروط الحالية للحجز" : "Current booking terms") : (ar ? "شروط الحجز" : "Booking terms")}</h3>
                      {typeof prior?.services === "string" && prior.services && <p className={styles.notes} dir="auto">{prior.services}</p>}
                      {priorScope && <p className={styles.notes} dir="auto">{priorScope}</p>}
                      {appliedScope && appliedScope !== priorScope && (
                        <div><h4>{ar ? "النطاق المتفق عليه" : "Agreed scope"}</h4><p className={styles.notes} dir="auto">{appliedScope}</p></div>
                      )}
                      {pending && <p>{ar ? "إصدار الحجز الحالي" : "Current revision"} <strong>{number.format(booking.revision)}</strong> · {ar ? "إصدار العميل" : "Customer revision"} <strong>{number.format(change.revision)}</strong></p>}
                      {pending && booking.revision !== change.revision && seen && (
                        <details><summary>{ar ? "الشروط التي راجعها العميل" : "Customer-reviewed terms"}</summary><pre>{JSON.stringify(seen.terms, null, 2)}</pre></details>
                      )}
                      {currentTotal !== undefined || agreedTotal !== undefined ? (
                        <p className={styles.total}>
                          <span>{delta ? (ar ? "الإجمالي المعدّل" : "Revised event total") : (ar ? "إجمالي الحجز" : "Booking total")}</span>
                          <span>
                            {delta ? <del><bdi>{currency.format(currentTotal!)}</bdi></del> : null}
                            <strong><bdi>{currency.format(agreedTotal ?? currentTotal!)}</bdi></strong>
                          </span>
                        </p>
                      ) : <p>{ar ? "لم يُسجّل إجمالي." : "No total was recorded."}</p>}
                    </section>

                    <div className={styles.agreement}>
                      <div className={styles.clientNotes}>
                        {image && <Image src={`/atelier/${image}.webp`} width={96} height={96} alt="" />}
                        <div>
                          <h3>{ar ? "طلب العميل" : "Customer request"}</h3>
                          <p className={styles.notes} dir={requested?.notes ? "auto" : undefined}>{requested?.notes || (ar ? "لم يضف العميل ملاحظات." : "The client left no notes.")}</p>
                        </div>
                      </div>
                      {pending && <ApplyBookingChangeForm key={booking.revision} changeRequestId={change.id} revision={booking.revision} requestedRevision={change.revision} kind={kind} locale={locale} />}
                    </div>
                </ChangeCard>
              );
            })}
          </div>
        ) : (
          <p className={styles.empty}>{search ? (ar ? "لا توجد تعديلات مطابقة." : "No matching changes.") : status === "pending" ? (ar ? "لا توجد تعديلات معلقة." : "No pending changes.") : (ar ? "لا توجد تعديلات في هذه القائمة." : "No changes in this view.")}</p>
        )}
      </div>
    </main>
  );
}
