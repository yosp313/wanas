import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { isLocale, type Locale } from "@/lib/i18n/config";
import type { RequestSnapshot } from "@/lib/planner/request-snapshot";
import { getAdminCalendar } from "@/lib/server/admin/calendar";
import { withPageAccess } from "@/lib/server/auth/page-access";
import { addCairoDays, cairoDateString } from "@/lib/server/time/cairo";
import { datesBetween, shiftMonth, startOfWeek, validDate } from "./dates";
import { CalendarIcon } from "./icons";
import styles from "./calendar.module.css";

const copy = {
  en: {
    title: "Calendar", loading: "Loading calendar…", filters: "Filter events", view: "Calendar view", month: "Month", week: "Week", agenda: "Agenda",
    previous: "Previous period", next: "Next period", today: "Today",
    all: "All events", confirmed: "Confirmed bookings", pending: "Pending requests",
    empty: "No events for this period.", search: "Search clients or venues…", searchButton: "Search",
    inbox: "Open requests inbox", hideSummary: "Hide summary", showSummary: "Show summary",
    schedule: "Atelier schedule", upcoming: "Upcoming this week", weekSummary: "Week at a glance",
    count: (count: number) => `${count} ${count === 1 ? "event" : "events"}`,
  },
  ar: {
    title: "التقويم", loading: "جارٍ تحميل التقويم…", filters: "تصفية الفعاليات", view: "عرض التقويم", month: "الشهر", week: "الأسبوع", agenda: "جدول المواعيد",
    previous: "الفترة السابقة", next: "الفترة التالية", today: "اليوم",
    all: "جميع الفعاليات", confirmed: "الحجوزات المؤكدة", pending: "الطلبات المعلقة",
    empty: "لا توجد فعاليات في هذه الفترة.", search: "ابحث عن عميل أو مكان…", searchButton: "بحث",
    inbox: "فتح صندوق الطلبات", hideSummary: "إخفاء الملخص", showSummary: "إظهار الملخص",
    schedule: "جدول الأتيليه", upcoming: "القادم هذا الأسبوع", weekSummary: "ملخص الأسبوع",
    count: (count: number) => `${count} من الفعاليات`,
  },
};

type CalendarQuery = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminCalendarPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: CalendarQuery;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <Suspense fallback={<main className={styles.loading} aria-busy="true">{copy[locale].loading}</main>}>
      <Calendar locale={locale} searchParams={searchParams} />
    </Suspense>
  );
}

async function Calendar({ locale, searchParams }: { locale: Locale; searchParams: CalendarQuery }) {
  const query = await searchParams;
  const text = copy[locale];
  const path = `/${locale}/admin/calendar`;
  const today = cairoDateString(new Date());
  const month = typeof query.month === "string" ? query.month : "";
  const monthStart = `${month}-01`;
  const defaultDate = validDate(monthStart) && month !== today.slice(0, 7) ? monthStart : today;
  const selected = validDate(query.date) ? query.date : defaultDate;
  const first = `${selected.slice(0, 7)}-01`;
  const nextMonth = shiftMonth(first, 1);
  const weekStart = startOfWeek(selected);
  const weekEnd = addCairoDays(weekStart, 7);
  const currentWeek = weekStart === startOfWeek(today);
  const summaryStart = currentWeek ? today : weekStart;
  const view = query.view === "week" || query.view === "agenda" ? query.view : "month";
  const legacyFilter = query.pending === "1" ? "all" : "confirmed";
  const filter = ["all", "confirmed", "pending"].find((value) => value === query.filter) ?? legacyFilter;
  const summaryVisible = query.summary !== "0";
  const search = typeof query.q === "string" ? query.q.trim().slice(0, 200) : "";
  const start = view === "week" ? weekStart : first;
  const end = view === "week" ? weekEnd : nextMonth;
  const state = {
    month: first.slice(0, 7),
    date: selected,
    view,
    filter,
    summary: summaryVisible ? "1" : "0",
    q: search,
  };
  function href(overrides: Partial<typeof state> = {}) {
    return `${path}?${new URLSearchParams({ ...state, ...overrides })}`;
  }
  function periodHref(date: string) {
    return href({ month: date.slice(0, 7), date });
  }
  function periodArrow(date: string, direction: "previous" | "next") {
    return validDate(date) ? (
      <Link className={styles.arrow} href={periodHref(date)} aria-label={text[direction]}>
        <CalendarIcon name={direction} />
      </Link>
    ) : <span className={styles.arrow} aria-hidden="true"><CalendarIcon name={direction} /></span>;
  }

  const calendar = await withPageAccess(locale, href(), () => getAdminCalendar(
    summaryVisible && summaryStart < start ? summaryStart : start,
    summaryVisible && weekEnd > end ? weekEnd : end,
    filter !== "confirmed",
  ));
  const searchTerm = search.toLocaleLowerCase(locale);
  const entries = (["confirmed", "pending"] as const).flatMap((status) =>
    calendar[status].map(({ details, ...entry }) => ({
      ...entry,
      status,
      venue: (details as Partial<RequestSnapshot> | null)?.venueName,
    })),
  ).filter(({ name, venue, status }) =>
    (filter === "all" || status === filter) &&
    (!search || [name, venue].some((value) => typeof value === "string" && value.toLocaleLowerCase(locale).includes(searchTerm))),
  ).sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name, locale));

  const visible = entries.filter(({ date }) => date >= start && date < end);
  const upcoming = entries.filter(({ date }) => date >= summaryStart && date < weekEnd);
  const entriesByDate = Map.groupBy(visible, ({ date }) => date);
  const gridStart = view === "week" ? weekStart : startOfWeek(first);
  const gridEnd = view === "week" ? weekEnd : addCairoDays(startOfWeek(addCairoDays(end, -1)), 7);
  const previous = view === "week" ? addCairoDays(selected, -7) : shiftMonth(first, -1);
  const next = view === "week" ? addCairoDays(selected, 7) : nextMonth;
  const monthFormat = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC", numberingSystem: "latn" });
  const dayFormat = new Intl.DateTimeFormat(locale, { weekday: "short", month: "short", day: "numeric", timeZone: "UTC", numberingSystem: "latn" });
  const weekdays = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
  const narrowWeekdays = new Intl.DateTimeFormat(locale, { weekday: "narrow", timeZone: "UTC" });
  const label = view === "week"
    ? dayFormat.formatRange(new Date(weekStart), new Date(addCairoDays(weekEnd, -1)))
    : monthFormat.format(new Date(first));
  const requestHref = (id: string) => `/${locale}/admin/requests/${id}`;

  function cards(items: typeof entries, isoDate = false) {
    if (items.length === 0) return <p className={styles.empty}>{text.empty}</p>;
    return (
      <ul className={styles.cards}>
        {items.map((entry) => (
          <li key={entry.requestId}>
            <Link href={requestHref(entry.requestId)} className={styles.card} data-status={entry.status}>
              <span className={styles.cardMeta}>
                <time dateTime={entry.date}>{isoDate ? entry.date : dayFormat.format(new Date(entry.date))}</time>
                <span className={styles.dot} aria-hidden="true" />
              </span>
              <strong><bdi>{entry.name}</bdi></strong>
              {entry.venue && <span className={styles.venue}><CalendarIcon name="pin" /><bdi>{entry.venue}</bdi></span>}
              <span className={styles.cardStatus}>{text[entry.status]}</span>
            </Link>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <main className={styles.workspace}>
      <header className={styles.header}>
        <form className={styles.search} action={path} role="search">
          {Object.entries(state).filter(([key]) => key !== "q").map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))}
          <button type="submit" aria-label={text.searchButton}><CalendarIcon name="search" /></button>
          <input key={search} type="search" name="q" defaultValue={search} placeholder={text.search} aria-label={text.search} maxLength={200} />
        </form>
        <UserButton />
      </header>
      <div className={styles.content}>
        <div className={styles.toolbar}>
          <div className={styles.controls}>
            <nav className={styles.views} aria-label={text.view}>
              {(["month", "week", "agenda"] as const).map((option) => (
                <Link key={option} href={href({ view: option })} aria-current={view === option ? "page" : undefined}>{text[option]}</Link>
              ))}
            </nav>
            <nav className={styles.period} aria-label={text.title}>
              {periodArrow(previous, "previous")}
              <h1>{label}</h1>
              {periodArrow(next, "next")}
            </nav>
            <Link className={styles.control} href={periodHref(today)}>{text.today}</Link>
          </div>
          <div className={styles.controls}>
            <Link className={styles.control} href={href({ summary: summaryVisible ? "0" : "1" })}>
              <CalendarIcon name="panel" />{summaryVisible ? text.hideSummary : text.showSummary}
            </Link>
            <Link className={styles.primary} href={`/${locale}/admin/inbox`}>
              <CalendarIcon name="inbox" />{text.inbox}
            </Link>
          </div>
        </div>
        <div className={styles.filters}>
          <nav className={styles.chips} aria-label={text.filters}>
            {(["all", "confirmed", "pending"] as const).map((option) => (
              <Link key={option} href={href({ filter: option })} aria-current={filter === option ? "true" : undefined} data-status={option}>
                {option !== "all" && <span className={styles.dot} aria-hidden="true" />}
                {text[option]}
              </Link>
            ))}
          </nav>
          <span className={styles.count}>{text.count(visible.length)}</span>
        </div>
        <div className={styles.board} data-summary={summaryVisible}>
          {view === "agenda" ? <section className={styles.agenda} aria-label={label}>{cards(visible, true)}</section> : (
            <div className={styles.grid} data-view={view} aria-label={label} role="group">
              {datesBetween(weekStart, weekEnd).map((date) => (
                <div className={styles.weekday} key={date}>
                  <span>{weekdays.format(new Date(date))}</span>
                  <span aria-hidden="true">{narrowWeekdays.format(new Date(date))}</span>
                </div>
              ))}
              {datesBetween(gridStart, gridEnd).map((date) => (
                <div className={styles.day} key={date} data-outside={date < start || date >= end} data-today={date === today}>
                  <div className={styles.dayHeading}>
                    <time dateTime={date} className={styles.dayNumber} aria-current={date === today ? "date" : undefined}>
                      {Number(date.slice(-2))}
                    </time>
                    {date === today && <span className={styles.todayLabel}>{text.today}</span>}
                  </div>
                  {(entriesByDate.get(date) ?? []).map((entry) => (
                    <Link key={entry.requestId} className={styles.event} data-status={entry.status}
                      href={requestHref(entry.requestId)} title={`${entry.name} · ${text[entry.status]} · ${date}`}>
                      <bdi>{entry.name}</bdi><span className={styles.srOnly}> · {text[entry.status]} · {date}</span>
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          )}
          {summaryVisible && (
            <aside className={styles.summary} aria-labelledby="calendar-summary">
              <div className={styles.summaryHeader}>
                <div>
                  <p>{text.schedule}</p>
                  <h2 id="calendar-summary">{currentWeek ? text.upcoming : text.weekSummary}</h2>
                </div>
                <span className={styles.badge}>{upcoming.length}</span>
              </div>
              {cards(upcoming)}
            </aside>
          )}
        </div>
      </div>
    </main>
  );
}
