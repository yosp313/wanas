import Link from "next/link";
import { LuArrowUpRight } from "react-icons/lu";
import { catalogLabel } from "@/lib/catalog/catalog";
import type { Locale } from "@/lib/i18n/config";
import type { RequestSnapshot } from "@/lib/planner/request-snapshot";
import type { getCustomerRequests } from "@/lib/server/requests/queries";
import { CAIRO_TIME_ZONE } from "@/lib/server/time/cairo";
import type { RequestEntry } from "./request-list";
import styles from "./requests.module.css";

type Request = Awaited<ReturnType<typeof getCustomerRequests>>[number];

export function requestEntry(request: Request, locale: Locale, today: string): RequestEntry {
  const ar = locale === "ar";
  const t = (en: string, arabic: string) => ar ? arabic : en;
  const details = request.details as Partial<RequestSnapshot> | null;
  const labels = details?.catalogLabels;
  const eventType = details?.eventTypeOther || labels?.eventType?.[locale] ||
    catalogLabel("eventTypes", details?.eventType ?? "", locale);
  const venueType = details?.venueTypeOther || labels?.venueType?.[locale] ||
    catalogLabel("venueTypes", details?.venueType ?? "", locale);
  const venue = details?.venueName || venueType;
  const title = eventType || t("Event request", "طلب مناسبة");
  const guestCount = details?.guestCount && new Intl.NumberFormat(locale).format(details.guestCount);
  const guests = guestCount ? t(`${guestCount} guests`, `${guestCount} ضيف`) : "";
  const catering = details?.cateringRequested
    ? labels?.cateringOption?.[locale] || catalogLabel("cateringOptions", details.cateringOption ?? "", locale) ||
      t("Requested", "مطلوبة")
    : t("Not requested", "غير مطلوبة");
  const budget = labels?.budgetRange?.[locale] || catalogLabel("budgetRanges", details?.budgetRange ?? "", locale);
  const quote = request.holdUntil ? request.quote : null;
  const booking = request.booking;
  const date = booking?.date ?? quote?.date ?? request.eventDate;
  const group = booking?.status === "confirmed" && date >= today ? "confirmed"
    : quote ? "proposals"
    : request.status === "submitted" || request.status === "quoted" ? "review"
    : "past";

  const status = booking?.status === "cancelled" ? t("Booking cancelled", "أُلغي الحجز")
    : booking?.status === "confirmed" ? t("Booking confirmed", "الحجز مؤكّد")
    : quote ? t("Quote ready", "عرض السعر جاهز للمراجعة")
    : request.status === "quoted" ? t("Quote expired", "انتهت صلاحية عرض السعر")
    : request.status === "submitted" ? t("In review", "قيد المراجعة")
    : request.status === "withdrawn" ? t("Withdrawn", "مسحوب")
    : t("Closed", "مغلق");
  const reference = `#${request.id.slice(0, 8).toUpperCase()}`;
  const href = `/${locale}/requests/${request.id}`;
  const bookingTotal = (request.bookingTerms as { totalEgp?: unknown } | null)?.totalEgp;
  const total = booking ? bookingTotal : quote?.total;
  const price = typeof total === "number"
    ? new Intl.NumberFormat(locale, { style: "currency", currency: "EGP", maximumFractionDigits: 0 }).format(total)
    : "";
  const eventDate = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeZone: "UTC" }).format(new Date(date + "T00:00:00Z"));
  const holdUntil = request.holdUntil && new Intl.DateTimeFormat(locale, {
    dateStyle: "medium", timeStyle: "short", timeZone: CAIRO_TIME_ZONE,
  }).format(request.holdUntil);
  const fields = [
    [t("Date", "التاريخ"), <time key={date} dateTime={date}>{eventDate}</time>],
    [t("Attendance", "الحضور"), guests],
    [t("Venue", "المكان"), venue],
    [t("Catering", "الضيافة"), catering],
  ] as const;
  const amount = (label: string, value: string) => (
    <div className={styles.amount}>
      <span>{label}</span>
      <strong><bdi>{value}</bdi></strong>
    </div>
  );

  return {
    id: request.id,
    group,
    date,
    searchText: [reference, request.id, venue, title].join(" "),
    card: (
      <article className={styles.card} data-group={group}>
        <div className={styles.record}>
          <header className={styles.cardHeader}>
            <bdi>{reference}</bdi>
            <span className={styles.status}>{status}</span>
          </header>
          <h2><Link href={href}><bdi>{title}</bdi></Link></h2>
          <dl className={styles.facts}>
            {fields.filter(([, value]) => value).map(([label, value]) => (
              <div key={label}><dt>{label}</dt><dd><bdi>{value}</bdi></dd></div>
            ))}
          </dl>
          {group === "review" && request.status === "submitted" && (
            <p className={styles.nextStep}>{t("WANAS is reviewing your brief. We’ll email you when there’s an update.", "يراجع فريق وناس تفاصيل مناسبتكم. سنراسلكم عند تحديث الطلب.")}</p>
          )}
        </div>
        <footer className={styles.cardFooter}>
          {quote ? amount(t("Quote total", "إجمالي عرض السعر"), price)
            : booking && price ? amount(t("Booking total", "إجمالي الحجز"), price)
            : group === "review" && budget ? amount(t("Requested budget", "الميزانية المطلوبة"), budget) : null}
          {holdUntil && (
            <p>{t("Date held until", "الموعد محجوز مؤقتًا حتى")} <strong><bdi>{holdUntil}</bdi></strong> {t("Cairo time", "بتوقيت القاهرة")}</p>
          )}
          <Link className={quote ? styles.primary : styles.secondary} href={quote ? `${href}#quotes` : href}>
            {quote ? t("Review quote", "مراجعة عرض السعر") : t("View request", "عرض الطلب")}
            <LuArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </footer>
      </article>
    ),
  };
}
