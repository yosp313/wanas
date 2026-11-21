"use client";

import { useRouter } from "next/navigation";
import { useTransition, type FormEvent } from "react";
import { toast } from "sonner";
import { useFieldValidation } from "@/components/forms/field-validation";
import { hasMinimumNotice } from "@/lib/server/time/cairo";
import { declineRequestAction, sendQuoteAction } from "@/app/actions/admin-requests";
import type { Locale } from "@/lib/i18n/config";

const errors = {
  DATE_UNAVAILABLE: ["That date is no longer available.", "هذا التاريخ غير متاح الآن."],
  OFFERED_DATE_TOO_SOON: ["Offer a date at least 10 days away.", "اختر موعدًا بعد 10 أيام على الأقل."],
  ORIGINAL_DATE_HOLD_TOO_LATE: ["The 48-hour hold must end before the event day.", "يجب أن تنتهي مهلة 48 ساعة قبل يوم المناسبة."],
  REQUEST_NOT_ACTIONABLE: ["The request is closed.", "تم إغلاق الطلب."],
  AUTH_REQUIRED: ["Sign in to continue.", "سجّل الدخول للمتابعة."],
  ADMIN_REQUIRED: ["Admin access is required.", "تتطلب العملية صلاحية الإدارة."],
  INVALID_OR_UNAVAILABLE: ["Check the details and try again.", "راجع التفاصيل وحاول مجددًا."],
};

export function AdminRequestActions({
  requestId, locale, eventDate, previous,
}: {
  requestId: string;
  locale: Locale;
  eventDate: string;
  previous?: { offeredDate: string; services: string; totalEgp: number; scopeExplanation: string | null };
}) {
  const ar = locale === "ar";
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const { field, error, setError } = useFieldValidation();
  const offeredDateLabel = ar ? "الموعد المعروض" : "Offered date";
  const servicesLabel = ar ? "الخدمات المضمّنة" : "Services";
  const servicesError = ar ? "أدخل الخدمات المضمّنة." : "Enter the included services.";
  const totalLabel = ar ? "الإجمالي بالجنيه المصري" : "Total EGP";

  function offeredDateError(value: string) {
    if (!value) return "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return ar ? "أدخل تاريخًا صالحًا." : "Enter a valid date.";
    }
    return value !== eventDate && !hasMinimumNotice(value, new Date()) ? errors.OFFERED_DATE_TOO_SOON[ar ? 1 : 0] : "";
  }

  function send(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const offeredDate = String(form.get("offeredDate") ?? "");
    const dateError = offeredDateError(offeredDate);
    if (dateError) {
      setError("offeredDate", dateError);
      return;
    }
    startTransition(async () => {
      const result = await sendQuoteAction(requestId, {
        offeredDate,
        services: String(form.get("services") ?? ""),
        totalEgp: Number(form.get("totalEgp")),
        scopeExplanation: String(form.get("scopeExplanation") ?? ""),
      });
      if (!result.ok) {
        const message = errors[result.code][ar ? 1 : 0];
        if (result.code === "DATE_UNAVAILABLE" || result.code === "OFFERED_DATE_TOO_SOON" || result.code === "ORIGINAL_DATE_HOLD_TOO_LATE") {
          setError("offeredDate", message);
        } else {
          toast.error(message);
        }
        return;
      }
      toast.success(ar ? "تم إرسال عرض السعر." : "Quote sent");
      router.refresh();
    });
  }

  function decline() {
    startTransition(async () => {
      const result = await declineRequestAction(requestId);
      if (!result.ok) {
        toast.error(errors[result.code][ar ? 1 : 0]);
        return;
      }
      toast.success(ar ? "تم رفض الطلب." : "Request declined");
      router.refresh();
    });
  }

  return (
    <section>
      <h2>{ar ? "إرسال عرض سعر" : "Send an offer"}</h2>
      <form onSubmit={send}>
        <label>{offeredDateLabel}
          <input name="offeredDate" type="date" aria-label={offeredDateLabel} required defaultValue={previous?.offeredDate ?? eventDate}
            {...field("offeredDate", ar ? "اختر الموعد المعروض." : "Choose an offered date.", (input) => offeredDateError(input.value))} />
          {error("offeredDate")}
        </label>
        <label>{servicesLabel}
          <textarea name="services" aria-label={servicesLabel} required maxLength={5000} defaultValue={previous?.services}
            {...field("services", servicesError, (input) => input.value.trim() ? "" : servicesError)} />
          {error("services")}
        </label>
        <label>{totalLabel}
          <input name="totalEgp" type="number" aria-label={totalLabel} min={0} max={2_147_483_647} required defaultValue={previous?.totalEgp}
            {...field("totalEgp", ar ? "أدخل مبلغًا صحيحًا بين 0 و2,147,483,647." : "Enter a whole amount between 0 and 2,147,483,647.")} />
          {error("totalEgp")}
        </label>
        <label>{ar ? "شرح تعديل نطاق العمل" : "Scope explanation"}
          <textarea name="scopeExplanation" maxLength={5000} defaultValue={previous?.scopeExplanation ?? ""} />
        </label>
        <button className="button" disabled={pending}>
          {previous ? (ar ? "استبدال العرض أو إرساله مجددًا" : "Replace or resend quote") : (ar ? "إرسال عرض السعر" : "Send quote")}
        </button>
      </form>
      <button type="button" onClick={decline} disabled={pending}>{ar ? "رفض الطلب" : "Decline request"}</button>
    </section>
  );
}
