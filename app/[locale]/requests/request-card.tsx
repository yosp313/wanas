import Image from "next/image";
import Link from "next/link";
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
        <header className={styles.cardHeader}>
          <div className={styles.reference}>
            <bdi>{reference}</bdi>
            {quote && venueType && <span><bdi>{venueType}</bdi></span>}
          </div>
          <span className={styles.status}>{status}</span>
        </header>

        <div className={quote ? styles.proposal : styles.summary}>
          <div>
            <h2><Link href={href}><bdi>{title}</bdi></Link></h2>
            {quote && details?.notes && <p className={styles.notes} dir="auto">{details.notes}</p>}
            <dl className={styles.facts}>
              {fields.filter(([, value]) => value).map(([label, value]) => (
                <div key={label}><dt>{label}</dt><dd><bdi>{value}</bdi></dd></div>
              ))}
            </dl>
          </div>
          {quote ? (
            <div className={styles.inspiration}>
              <div className={styles.inspirationHeading}>
                <p>{t("Decor examples", "أمثلة على الديكور")}</p>
                <Link href={`/${locale}#ceremonies`}>{t("Explore decor", "استكشفوا الديكور")}</Link>
              </div>
              <div className={styles.photos}>
                <figure>
                  <Image src="/atelier/home/cloche.webp" alt="" fill sizes="(max-width: 760px) 42vw, 220px" />
                  <figcaption>{t("Table styling", "تنسيق الطاولات")}</figcaption>
                </figure>
                <figure>
                  <Image src="/atelier/home/kosha.webp" alt="" fill sizes="(max-width: 760px) 42vw, 220px" />
                  <figcaption>{t("Ceremony decor", "ديكور المراسم")}</figcaption>
                </figure>
              </div>
              <div className={styles.palette}>
                {t("Terracotta & warm neutrals", "تيراكوتا ودرجات حيادية دافئة")}
                <span aria-hidden="true"><i /><i /><i /><i /></span>
              </div>
            </div>
          ) : booking && price ? amount(t("Booking total", "إجمالي الحجز"), price)
            : group === "review" && budget ? amount(t("Requested budget", "الميزانية المطلوبة"), budget)
            : null}
        </div>

        {quote && (
          <div className={styles.allocation}>
            {amount(t("Quote total", "إجمالي عرض السعر"), price)}
            {budget && <span>{t("Requested budget", "الميزانية المطلوبة")} · <bdi>{budget}</bdi></span>}
          </div>
        )}
        {group === "review" && request.status === "submitted" && (
          <div className={styles.progress}>
            <div>
              <p>{t("Request progress", "تقدّم الطلب")}</p>
              <p>{t("In review", "قيد المراجعة")}</p>
            </div>
            <ol>
              <li data-complete>{t("Request received", "استلمنا الطلب")}</li>
              <li aria-current="step">{t("WANAS review", "مراجعة وناس")}</li>
              <li>{t("Quote ready", "عرض السعر")}</li>
              <li>{t("Booking confirmed", "تأكيد الحجز")}</li>
            </ol>
          </div>
        )}

        <footer className={styles.cardFooter}>
          {holdUntil && (
            <p>{t("Date held until", "الموعد محجوز مؤقتًا حتى")} <strong><bdi>{holdUntil}</bdi></strong> {t("Cairo time", "بتوقيت القاهرة")}</p>
          )}
          {group === "confirmed" && <p className={styles.bookingNote}>{t("Your event date is reserved.", "تم حجز موعد مناسبتكم.")}</p>}
          <div className={styles.cardActions}>
            {quote && <Link className={styles.secondary} href={href}>{t("View request", "عرض الطلب")}</Link>}
            <Link className={quote ? styles.primary : styles.secondary}
              href={quote ? `${href}#quotes` : href}>
              {quote ? t("Review quote", "مراجعة عرض السعر") : t("View request", "عرض الطلب")}
            </Link>
          </div>
        </footer>
      </article>
    ),
  };
}
