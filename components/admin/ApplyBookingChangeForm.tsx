"use client";

import { useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { submitBookingAgreement } from "@/app/actions/booking-changes";
import { useFieldValidation } from "@/components/forms/field-validation";
import type { BookingAgreement } from "@/lib/server/bookings/actions";

const messages: Record<string, { en: string; ar: string }> = {
  STALE_BOOKING_REVISION: { en: "The booking changed. Review the current revision.", ar: "تغير الحجز. راجع الإصدار الحالي." },
  BOOKING_CHANGE_CUTOFF_PASSED: { en: "The booking change cutoff has passed.", ar: "انتهى الموعد المسموح لتعديل الحجز." },
  DATE_UNAVAILABLE: { en: "The requested date is unavailable.", ar: "التاريخ المطلوب غير متاح." },
  DATE_UNCHANGED: { en: "The requested date matches the current date.", ar: "التاريخ المطلوب يطابق تاريخ الحجز الحالي." },
  DESTINATION_TOO_SOON: { en: "The new date needs at least 10 days' notice.", ar: "يحتاج التاريخ الجديد إلى مهلة 10 أيام على الأقل." },
};

export function ApplyBookingChangeForm({ changeRequestId, revision, requestedRevision, kind, locale = "en" }: { changeRequestId: string; revision: number; requestedRevision: number; kind: string; locale?: "ar" | "en" }) {
  const router = useRouter();
  const [newTotal, setNewTotal] = useState("");
  const [scopeExplanation, setScopeExplanation] = useState("");
  const [pending, startTransition] = useTransition();
  const { field, error, setError } = useFieldValidation();
  const requiresReview = requestedRevision !== revision;
  const text = (en: string, ar: string) => locale === "ar" ? ar : en;
  const reviewLabel = text("I reviewed the current booking revision", "راجعت إصدار الحجز الحالي");
  const totalLabel = text("Agreed total (EGP)", "الإجمالي المتفق عليه (جنيه)");
  const totalError = text("Enter a whole amount between 0 and 2,147,483,647.", "أدخل مبلغًا صحيحًا بين 0 و2,147,483,647.");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const agreement: BookingAgreement = {};
    if (kind !== "cancellation") {
      if (newTotal !== "") agreement.totalEgp = Number(newTotal);
      if (scopeExplanation.trim()) agreement.scopeExplanation = scopeExplanation.trim();
    }
    startTransition(async () => {
      const result = await submitBookingAgreement(changeRequestId, revision, agreement);
      if (!result.ok) {
        if (result.code === "INVALID_TOTAL") setError("newTotal", totalError);
        else toast.error(messages[result.code]?.[locale] ?? text("Unable to apply change.", "تعذر تطبيق الاتفاق."));
        return;
      }
      toast.success(text("Change applied.", "تم تطبيق الاتفاق."));
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit}>
      {requiresReview && (
        <label>
          <input type="checkbox" aria-label={reviewLabel} required {...field("reviewed", text("Confirm that you reviewed the current revision.", "أكّد مراجعة الإصدار الحالي."))} />
          {reviewLabel}
          {error("reviewed")}
        </label>
      )}
      {kind !== "cancellation" && (
        <>
          <label>
            {totalLabel}
            <input type="number" aria-label={totalLabel} min="0" max={2_147_483_647} step="1" value={newTotal}
              onChange={(event) => setNewTotal(event.target.value)} {...field("newTotal", totalError)} />
            {error("newTotal")}
          </label>
          <label>
            {text("Agreed scope", "النطاق المتفق عليه")}
            <textarea value={scopeExplanation} onChange={(event) => setScopeExplanation(event.target.value)} />
          </label>
        </>
      )}
      <button type="submit" disabled={pending}>
        {pending ? text("Applying…", "جارٍ التطبيق…") : text("Apply agreement", "تطبيق الاتفاق")}
      </button>
    </form>
  );
}
