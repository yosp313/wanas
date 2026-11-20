export const CAIRO_TIME_ZONE = "Africa/Cairo";

/** Return the Cairo calendar date without converting through local machine time. */
export function cairoDateString(value: Date) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: CAIRO_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(value);
}

function dateValue(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("INVALID_DATE");
  const parsed = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new Error("INVALID_DATE");
  return parsed;
}

/** Add calendar days, independent of DST and the server's timezone. */
export function addCairoDays(value: string, days: number) {
  const result = dateValue(value);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export function calendarDayDifference(from: string, to: string) {
  return Math.trunc((dateValue(to).getTime() - dateValue(from).getTime()) / 86400000);
}

export function hasMinimumNotice(eventDate: string, now: Date) {
  return calendarDayDifference(cairoDateString(now), eventDate) >= 10;
}

/** The last instant at which a booking change may be submitted or applied. */
export function bookingChangeCutoff(eventDate: string) {
  return addCairoDays(eventDate, -10);
}

export function isWithinBookingChangeCutoff(eventDate: string, now: Date) {
  return cairoDateString(now) <= bookingChangeCutoff(eventDate);
}
