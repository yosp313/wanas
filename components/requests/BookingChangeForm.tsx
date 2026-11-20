"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitBookingChange } from "@/app/actions/booking-changes";
import type { BookingChange } from "@/lib/server/bookings/actions";

const messages: Record<string, { en: string; ar: string }> = {
  BOOKING_CHANGE_CUTOFF_PASSED: { en: "The booking change cutoff has passed.", ar: "انتهى الموعد المسموح لتعديل الحجز." },
  BOOKING_NOT_ACTIVE: { en: "This booking is no longer active.", ar: "لم يعد هذا الحجز نشطاً." },
  DATE_UNCHANGED: { en: "Choose a different date.", ar: "اختر تاريخاً مختلفاً." },
  DATE_UNAVAILABLE: { en: "That date is unavailable.", ar: "هذا التاريخ غير متاح." },
  DESTINATION_TOO_SOON: { en: "The new date needs at least 10 days' notice.", ar: "يحتاج التاريخ الجديد إلى مهلة 10 أيام على الأقل." },
  STALE_BOOKING_REVISION: { en: "This booking changed. Refresh and try again.", ar: "تغير الحجز. حدّث الصفحة وحاول مرة أخرى." },
};

export function BookingChangeForm({ bookingId, revision, locale = "en" }: { bookingId: string; revision: number; locale?: "ar" | "en" }) {
  const router = useRouter();
  const [kind, setKind] = useState<"cancellation" | "reschedule" | "scope">("reschedule");
  const [newDate, setNewDate] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const text = (en: string, ar: string) => locale === "ar" ? ar : en;
  return <form onSubmit={(event) => { event.preventDefault(); const change: BookingChange = { kind, newDate: kind === "reschedule" ? newDate : undefined, notes }; startTransition(async () => { const result = await submitBookingChange(bookingId, revision, change); if (result.ok) { setMessage(text("Change request sent.", "تم إرسال طلب التعديل.")); router.refresh(); } else setMessage(messages[result.code]?.[locale] ?? text("Unable to send request.", "تعذر إرسال الطلب.")); }); }}>
    <label>{text("Request type", "نوع الطلب")} <select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}><option value="reschedule">{text("Reschedule", "إعادة جدولة")}</option><option value="scope">{text("Scope or price", "النطاق أو السعر")}</option><option value="cancellation">{text("Cancellation", "إلغاء")}</option></select></label>
    {kind === "reschedule" && <label>{text("New date", "التاريخ الجديد")} <input type="date" value={newDate} onChange={(event) => setNewDate(event.target.value)} required /></label>}
    <label>{text("Notes", "ملاحظات")} <textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
    <button type="submit" disabled={pending}>{pending ? text("Sending…", "جارٍ الإرسال…") : "Request change"}</button>
    {message && <p role="status">{message}</p>}
  </form>;
}
