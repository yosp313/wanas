export const CAIRO_TIME_ZONE = "Africa/Cairo";
export function cairoDateString(value: Date) { return new Intl.DateTimeFormat("en-CA", { timeZone: CAIRO_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(value); }
export function hasMinimumNotice(eventDate: string, now: Date) { const start = new Date(`${cairoDateString(now)}T00:00:00Z`); const target = new Date(`${eventDate}T00:00:00Z`); return Math.round((target.getTime() - start.getTime()) / 86400000) >= 10; }
