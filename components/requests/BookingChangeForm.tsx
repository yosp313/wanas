"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { submitBookingChange } from "@/app/actions/booking-changes";
import { useFieldValidation } from "@/components/forms/field-validation";
import type { BookingChange } from "@/lib/server/bookings/actions";

const messages: Record<string, { en: string; ar: string }> = {
  BOOKING_CHANGE_CUTOFF_PASSED: { en: "The booking change cutoff has passed.", ar: "انتهى الموعد المسموح لتعديل الحجز." },
  BOOKING_NOT_ACTIVE: { en: "This booking is no longer active.", ar: "لم يعد هذا الحجز نشطاً." },
  STALE_BOOKING_REVISION: { en: "This booking changed. Refresh and try again.", ar: "تغير الحجز. حدّث الصفحة وحاول مرة أخرى." },
};

export function BookingChangeForm({ bookingId, revision, locale = "en" }: { bookingId: string; revision: number; locale?: "ar" | "en" }) {
  const router = useRouter();
  const [kind, setKind] = useState<"cancellation" | "reschedule" | "scope">("reschedule");
  const [newDate, setNewDate] = useState("");
  const [notes, setNotes] = useState("");
  const [pending, startTransition] = useTransition();
  const { field, error } = useFieldValidation();
  const text = (en: string, ar: string) => locale === "ar" ? ar : en;

  const dateLabel = text("New date", "التاريخ الجديد");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const change: BookingChange = { kind, newDate: kind === "reschedule" ? newDate : undefined, notes };
    startTransition(async () => {
      const result = await submitBookingChange(bookingId, revision, change);
      if (!result.ok) {
        toast.error(messages[result.code]?.[locale] ?? text("Unable to send request.", "تعذر إرسال الطلب."));
        return;
      }
      toast.success(text("Change request sent.", "تم إرسال طلب التعديل."));
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit}>
      <label>
        {text("Request type", "نوع الطلب")}
        <select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}>
          <option value="reschedule">{text("Reschedule", "إعادة جدولة")}</option>
          <option value="scope">{text("Scope or price", "النطاق أو السعر")}</option>
          <option value="cancellation">{text("Cancellation", "إلغاء")}</option>
        </select>
      </label>
      {kind === "reschedule" && (
        <label>
          {dateLabel}
          <input type="date" aria-label={dateLabel} value={newDate} onChange={(event) => setNewDate(event.target.value)} required
            {...field("newDate", text("Choose a new date.", "اختر تاريخًا جديدًا."))} />
          {error("newDate")}
        </label>
      )}
      <label>
        {text("Notes", "ملاحظات")}
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} />
      </label>
      <button type="submit" disabled={pending}>
        {pending ? text("Sending…", "جارٍ الإرسال…") : text("Request change", "طلب تعديل")}
      </button>
    </form>
  );
}
