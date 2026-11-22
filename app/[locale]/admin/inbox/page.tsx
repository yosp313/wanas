import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { budgetRanges, catalogLabel } from "@/lib/catalog/catalog";
import { isLocale, type Locale } from "@/lib/i18n/config";
import type { RequestSnapshot } from "@/lib/planner/request-snapshot";
import { withPageAccess } from "@/lib/server/auth/page-access";
import { getAdminInbox } from "@/lib/server/admin/queries";
import { CalendarIcon } from "../calendar/icons";
import { RequestPreview } from "./request-preview";
import styles from "./inbox.module.css";

const filters = ["all", "submitted", "quoted", "archived"] as const;
const moodboardImages: Record<string, string> = {
  "sunlit-terracotta": "terracotta",
  "quiet-olive": "greenhouse",
  "ivory-garden": "ivory",
  "midnight-candlelight": "emerald",
};

type InboxQuery = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminInboxPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: InboxQuery;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <Suspense fallback={<main className={styles.content} aria-busy="true">{locale === "ar" ? "جارٍ تحميل الطلبات…" : "Loading requests…"}</main>}>
      <Inbox locale={locale} searchParams={searchParams} />
    </Suspense>
  );
}

async function Inbox({ locale, searchParams }: { locale: Locale; searchParams: InboxQuery }) {
  const ar = locale === "ar";
  const path = `/${locale}/admin/inbox`;
  const query = await searchParams;
  const status = filters.find((value) => value === query.status) ?? "all";
  const search = typeof query.q === "string" ? query.q.trim().slice(0, 200) : "";
  const eventType = typeof query.type === "string" ? query.type : "";
  const sort = query.sort === "date" || query.sort === "budget" ? query.sort : "newest";
  const state = { status, q: search, type: eventType, sort };

  function href(overrides: Partial<typeof state & { request: string }> = {}) {
    return `${path}?${new URLSearchParams({ ...state, ...overrides })}`;
  }

  const { requests, failures, confirmed } = await withPageAccess(
    locale, href(typeof query.request === "string" ? { request: query.request } : {}),
    () => getAdminInbox(status === "archived"),
  );
  const statusLabels = ar
    ? { all: "الكل", submitted: "جديد", quoted: "عرض مرسل", archived: "الأرشيف", booked: "محجوز", closed: "مغلق", withdrawn: "مسحوب" }
    : { all: "All", submitted: "New", quoted: "Quoted", archived: "Archived", booked: "Booked", closed: "Closed", withdrawn: "Withdrawn" };
  const active = requests.filter((request) => request.status === "submitted" || request.status === "quoted");
  const source = status === "archived"
    ? requests.filter((request) => request.status !== "submitted" && request.status !== "quoted")
    : active;
  const dateFormat = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" });
  const numberFormat = new Intl.NumberFormat(locale);
  const noCatering = ar ? "الضيافة غير مطلوبة" : "No catering requested";
  const cards = source.map((request) => {
    const details = request.details as Partial<RequestSnapshot> | null;
    const labels = details?.catalogLabels;
    const type = details?.eventType ?? "";
    const typeLabel = labels?.eventType?.[locale] || catalogLabel("eventTypes", type, locale);
    const venueType = details?.venueTypeOther || labels?.venueType?.[locale] || catalogLabel("venueTypes", details?.venueType ?? "", locale);
    const band = details?.budgetRange;
    const moodboard = details?.moodboard ?? "";
    return {
      id: request.id,
      name: request.customerName,
      status: request.status,
      statusLabel: statusLabels[request.status as keyof typeof statusLabels] ?? request.status,
      unavailable: request.dateUnavailable,
      date: request.eventDate,
      dateLabel: dateFormat.format(new Date(request.eventDate + "T00:00:00Z")),
      type,
      typeLabel,
      event: details?.eventTypeOther || typeLabel,
      guests: details?.guestCount ? (ar ? `${numberFormat.format(details.guestCount)} ضيف` : `${numberFormat.format(details.guestCount)} guests`) : "",
      venue: details?.venueName || venueType,
      budget: labels?.budgetRange?.[locale] || catalogLabel("budgetRanges", band ?? "", locale),
      budgetRank: budgetRanges.findIndex(({ id }) => id === band),
      catering: details?.cateringRequested
        ? labels?.cateringOption?.[locale] || catalogLabel("cateringOptions", details.cateringOption ?? "", locale)
        : noCatering,
      email: request.customerEmail,
      phone: request.customerMobile,
      moodboard: labels?.moodboard?.[locale] || catalogLabel("moodboards", moodboard, locale),
      moodboardImage: Object.hasOwn(moodboardImages, moodboard) ? moodboardImages[moodboard] : undefined,
      palette: labels?.palette?.[locale] || catalogLabel("palettes", details?.palette ?? "", locale),
      decor: labels?.decorMode?.[locale] || catalogLabel("decorModes", details?.decorMode ?? "", locale),
      notes: details?.notes,
    };
  });
  const eventTypes = new Map(cards.filter((card) => card.type).map((card) => [card.type, card.typeLabel]));
  const selectedType = eventTypes.has(eventType) ? eventType : "";
  const searchTerm = search.toLocaleLowerCase(locale);
  const visible = cards.filter((card) =>
    (status === "all" || status === "archived" || card.status === status) &&
    (!selectedType || card.type === selectedType) &&
    [card.name, card.email, card.phone, card.venue, card.event, card.id].some((value) =>
      value?.toLocaleLowerCase(locale).includes(searchTerm),
    ),
  );
  if (sort === "date") visible.sort((a, b) => a.date.localeCompare(b.date));
  if (sort === "budget") visible.sort((a, b) => b.budgetRank - a.budgetRank);
  const selected = visible.find((card) => card.id === query.request) ?? visible[0];
  const searchLabel = ar ? "ابحث عن طلب أو عميل" : "Search requests or clients";
  const failuresLabel = ar ? "رسائل البريد التي تعذر إرسالها" : "Notification failures";
  const stats = [
    { label: ar ? "طلبات جديدة" : "New inquiries", value: active.filter((request) => request.status === "submitted").length, icon: "mail" },
    { label: ar ? "عروض مرسلة" : "Quotes sent", value: active.filter((request) => request.status === "quoted").length, icon: "quote" },
    { label: ar ? "تعارضات المواعيد" : "Date conflicts", value: active.filter((request) => request.dateUnavailable).length, icon: "alert" },
    { label: ar ? "حجوزات هذا الشهر" : "Confirmed this month", value: confirmed, icon: "check" },
  ] as const;

  return (
    <main className={styles.workspace}>
      <header className={styles.header}>
        <form id="inbox-filters" action={path} className={styles.search} role="search" key={search}>
          {status !== "all" && <input type="hidden" name="status" value={status} />}
          <button type="submit" aria-label={searchLabel}><CalendarIcon name="search" /></button>
          <input type="search" name="q" aria-label={searchLabel} placeholder={searchLabel + "…"} defaultValue={search} maxLength={200} />
        </form>
        <div className={styles.account}>
          {failures.length > 0 && <a href="#notification-failures" aria-label={failuresLabel}><CalendarIcon name="bell" /></a>}
          <UserButton />
        </div>
      </header>

      <div className={styles.content}>
        <div className={styles.title}>
          <h1>{ar ? "صندوق الطلبات" : "Request inbox"}</h1>
          <p>{ar ? "راجع طلبات المناسبات وأرسل عروض الأسعار." : "Review event requests and send quotes."}</p>
        </div>
        <dl className={styles.stats}>
          {stats.map(({ label, value, icon }) => (
            <div key={icon} data-icon={icon}>
              <dt>{label}<span><CalendarIcon name={icon} /></span></dt>
              <dd>{numberFormat.format(value)}</dd>
            </div>
          ))}
        </dl>

        <div className={styles.filters}>
          <nav aria-label={ar ? "حالة الطلب" : "Request status"}>
            {filters.map((filter) => (
              <Link key={filter} href={href({ status: filter })} aria-current={filter === status ? "page" : undefined} scroll={false}>
                {statusLabels[filter]}{filter === "all" && ` (${numberFormat.format(active.length)})`}
              </Link>
            ))}
          </nav>
          <div className={styles.controls} key={selectedType + ":" + sort}>
            <select form="inbox-filters" name="type" aria-label={ar ? "نوع المناسبة" : "Event type"} defaultValue={selectedType}>
              <option value="">{ar ? "كل المناسبات" : "All event types"}</option>
              {[...eventTypes].map(([id, label]) => <option value={id} key={id}>{label}</option>)}
            </select>
            <select form="inbox-filters" name="sort" aria-label={ar ? "الترتيب" : "Sort requests"} defaultValue={sort}>
              <option value="newest">{ar ? "الأحدث أولاً" : "Newest first"}</option>
              <option value="budget">{ar ? "الميزانية الأعلى أولاً" : "Highest budget first"}</option>
              <option value="date">{ar ? "أقرب موعد أولاً" : "Soonest event first"}</option>
            </select>
            <button form="inbox-filters" type="submit">{ar ? "تطبيق" : "Apply"}</button>
          </div>
        </div>

        {selected ? (
          <div className={styles.board}>
            <ul className={styles.requests} aria-label={ar ? "الطلبات" : "Requests"}>
              {visible.map((card) => (
                <li key={card.id}>
                  <Link className={styles.card} href={href({ request: card.id }) + "#request-preview"} prefetch={false}
                    aria-label={card.name} aria-current={card.id === selected.id ? "true" : undefined}>
                    <header>
                      <h2><bdi>{card.name}</bdi></h2>
                      <span className={styles.status} data-status={card.status}>{card.statusLabel}</span>
                      {card.guests && <span className={styles.guests}>{card.guests}</span>}
                    </header>
                    {card.event && <p className={styles.event}><bdi>{card.event}</bdi></p>}
                    <div className={styles.meta}>
                      <span><CalendarIcon name="calendar" /><time dateTime={card.date}>{card.dateLabel}</time></span>
                      {card.budget && <span><CalendarIcon name="budget" /><strong>{card.budget}</strong></span>}
                      {card.venue && <span><CalendarIcon name="pin" /><bdi>{card.venue}</bdi></span>}
                      {card.catering && <span><CalendarIcon name="catering" /><bdi>{card.catering}</bdi></span>}
                    </div>
                    {card.unavailable && <p className={styles.unavailable}>{ar ? "التاريخ غير متاح" : "Date unavailable"}</p>}
                  </Link>
                </li>
              ))}
            </ul>
            <RequestPreview request={selected} locale={locale} />
          </div>
        ) : (
          <p className={styles.empty}>{ar ? "لا توجد طلبات مطابقة." : "No matching requests."}</p>
        )}

        {failures.length > 0 && (
          <section id="notification-failures" className={styles.failures}>
            <h2>{failuresLabel}</h2>
            <ul>
              {failures.map((job) => (
                <li key={job.id}>
                  {job.requestId && <Link href={`/${locale}/admin/requests/${job.requestId}`}>{ar ? "عرض الطلب" : "Open request"}</Link>}
                  <code><bdi>{job.kind} · {job.providerError ?? "unknown"}</bdi></code>
                  <time dateTime={job.updatedAt.toISOString()}>{job.updatedAt.toLocaleString(locale, { numberingSystem: "latn" })}</time>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
}
