import { addCairoDays, calendarDayDifference } from "@/lib/server/time/cairo";

function utcDate(date: string) {
  return new Date(`${date}T00:00:00Z`);
}

export function validDate(date: unknown): date is string {
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date) || date < "1000-01-01" || date > "9998-12-31") return false;
  const value = utcDate(date);
  return !Number.isNaN(value.getTime()) && value.toISOString().slice(0, 10) === date;
}

export function shiftMonth(first: string, offset: number) {
  const date = utcDate(first);
  date.setUTCMonth(date.getUTCMonth() + offset);
  return date.toISOString().split("T")[0];
}

export function startOfWeek(date: string) {
  return addCairoDays(date, -utcDate(date).getUTCDay());
}

export function datesBetween(start: string, end: string) {
  return Array.from({ length: calendarDayDifference(start, end) }, (_, index) => addCairoDays(start, index));
}
