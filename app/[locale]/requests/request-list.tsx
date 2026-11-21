"use client";

import { useState, type ReactNode } from "react";
import { LuSearch } from "react-icons/lu";
import type { Locale } from "@/lib/i18n/config";
import styles from "./requests.module.css";

export type RequestEntry = {
  id: string;
  group: "review" | "proposals" | "confirmed" | "past";
  date: string;
  searchText: string;
  card: ReactNode;
};

export function RequestList({ entries, locale, emptyMessage }: {
  entries: RequestEntry[];
  locale: Locale;
  emptyMessage: string;
}) {
  const [group, setGroup] = useState<RequestEntry["group"] | "all">("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date");
  const ar = locale === "ar";
  const filters = [
    ["all", ar ? "كل الطلبات" : "All requests"],
    ["review", ar ? "قيد المراجعة" : "In review"],
    ["proposals", ar ? "العروض الجاهزة" : "Proposals ready"],
    ["confirmed", ar ? "الحجوزات المؤكدة" : "Confirmed bookings"],
    ["past", ar ? "الأرشيف" : "Archive"],
  ] as const;
  const term = search.trim().toLocaleLowerCase(locale);
  const visible = entries.filter((entry) =>
    (group === "all" || entry.group === group) && entry.searchText.toLocaleLowerCase(locale).includes(term),
  );
  if (sort === "date") {
    visible.sort((a, b) => Number(a.group === "past") - Number(b.group === "past") || a.date.localeCompare(b.date));
  }
  const count = new Intl.NumberFormat(locale);
  const searchLabel = ar ? "ابحثوا بالرقم المرجعي أو المكان" : "Search by reference or venue";

  return (
    <section id="request-list" aria-label={ar ? "الطلبات" : "Requests"}>
      {entries.length > 0 && (
        <div className={styles.toolbar}>
          <div className={styles.filters} role="group" aria-label={ar ? "حالة الطلب" : "Request status"}>
            {filters.map(([value, label]) => (
              <button key={value} type="button" aria-pressed={group === value} onClick={() => setGroup(value)}>
                {label} ({count.format(value === "all" ? entries.length : entries.filter((entry) => entry.group === value).length)})
              </button>
            ))}
          </div>
          <div className={styles.controls}>
            <label className={styles.search}>
              <LuSearch size={16} aria-hidden="true" />
              <input type="search" aria-label={searchLabel} placeholder={searchLabel + "…"} value={search}
                onChange={(event) => setSearch(event.target.value)} />
            </label>
            <label className={styles.sort}>
              {ar ? "الترتيب" : "Sort"}
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="date">{ar ? "تاريخ المناسبة" : "Event date"}</option>
                <option value="newest">{ar ? "أحدث الطلبات" : "Newest requests"}</option>
              </select>
            </label>
          </div>
        </div>
      )}
      {visible.length ? (
        <ul className={styles.list}>
          {visible.map(({ id, card }) => <li key={id}>{card}</li>)}
        </ul>
      ) : (
        <p className={styles.empty} role="status">
          {entries.length ? (ar ? "لا توجد طلبات مطابقة." : "No matching requests.") : emptyMessage}
        </p>
      )}
    </section>
  );
}
