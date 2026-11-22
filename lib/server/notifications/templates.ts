import type { Mail, NotificationJob, NotificationLocale } from "./types";

const copy = {
  en: {
    request_submitted: ["We received your WANAS request", "We'll email you after we review your request."],
    quote_ready: ["Your WANAS quote is ready", "Open your request to see the services, price, and date."],
    request_declined: ["An update from WANAS", "WANAS could not take on this request."],
    booking_confirmed: ["Your WANAS booking is confirmed", "Your booking is confirmed."],
    booking_cancelled: ["Your WANAS booking was cancelled", "Your booking has been cancelled."],
    booking_rescheduled: ["Your WANAS booking was rescheduled", "Your booking date has changed."],
  },
  ar: {
    request_submitted: ["استلم فريق وناس طلبك", "سنرسل إليك رسالة بعد مراجعة طلبك."],
    quote_ready: ["عرض وناس جاهز", "افتح طلبك للاطّلاع على الخدمات والسعر والموعد."],
    request_declined: ["تحديث من وناس", "يتعذر على وناس تنفيذ هذا الطلب."],
    booking_confirmed: ["تم تأكيد حجزك مع وناس", "تم تأكيد حجز مناسبتك."],
    booking_cancelled: ["تم إلغاء حجزك مع وناس", "تم إلغاء حجزك."],
    booking_rescheduled: ["تم تغيير موعد حجزك مع وناس", "تم تغيير تاريخ حجزك."],
  },
} as const;

function esc(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
}

export function renderNotification(job: NotificationJob, appOrigin: string): Mail {
  const locale: NotificationLocale = job.payload.locale;
  const [subject, summary] = copy[locale][job.type];
  const name = job.payload.customerName ? esc(job.payload.customerName) : locale === "ar" ? "عميلنا" : "there";
  const link = `${appOrigin.replace(/\/$/, "")}/${locale}/requests/${encodeURIComponent(job.payload.requestId)}`;
  const details = [job.payload.offeredDate && `${locale === "ar" ? "التاريخ" : "Date"}: ${esc(job.payload.offeredDate)}`, job.payload.totalEgp !== undefined && `${locale === "ar" ? "الإجمالي" : "Total"}: ${job.payload.totalEgp.toLocaleString()} EGP`, job.payload.newDate && `${locale === "ar" ? "الموعد الجديد" : "New date"}: ${esc(job.payload.newDate)}`].filter(Boolean).join("<br>");
  const button = locale === "ar" ? "فتح طلبك" : "Open your request";
  const text = `${summary} ${job.payload.offeredDate ?? ""} ${job.payload.newDate ?? ""} ${link}`.trim();
  return { to: job.payload.recipient, subject, text, html: `<main dir="${locale === "ar" ? "rtl" : "ltr"}"><p>${name}</p><h1>${esc(subject)}</h1><p>${esc(summary)}</p>${details ? `<p>${details}</p>` : ""}<p><a href="${esc(link)}">${button}</a></p></main>` };
}
