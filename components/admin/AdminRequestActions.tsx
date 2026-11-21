"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
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
  const [message, setMessage] = useState("");

  function send(form: FormData) {
    startTransition(async () => {
      const result = await sendQuoteAction(requestId, {
        offeredDate: String(form.get("offeredDate") ?? ""),
        services: String(form.get("services") ?? ""),
        totalEgp: Number(form.get("totalEgp")),
        scopeExplanation: String(form.get("scopeExplanation") ?? ""),
      });
      if (!result.ok) {
        setMessage(errors[result.code][ar ? 1 : 0]);
        return;
      }
      setMessage(ar ? "تم إرسال عرض السعر." : "Quote sent");
      router.refresh();
    });
  }

  function decline() {
    startTransition(async () => {
      const result = await declineRequestAction(requestId);
      setMessage(result.ok ? (ar ? "تم رفض الطلب." : "Request declined") : errors[result.code][ar ? 1 : 0]);
      if (result.ok) router.refresh();
    });
  }

  return (
    <section>
      <h2>{ar ? "إرسال عرض سعر" : "Send an offer"}</h2>
      <form action={send}>
        <label>{ar ? "الموعد المعروض" : "Offered date"}
          <input name="offeredDate" type="date" required defaultValue={previous?.offeredDate ?? eventDate} />
        </label>
        <label>{ar ? "الخدمات المضمّنة" : "Services"}
          <textarea name="services" required maxLength={5000} defaultValue={previous?.services} />
        </label>
        <label>{ar ? "الإجمالي بالجنيه المصري" : "Total EGP"}
          <input name="totalEgp" type="number" min={0} max={2_147_483_647} required defaultValue={previous?.totalEgp} />
        </label>
        <label>{ar ? "شرح تعديل نطاق العمل" : "Scope explanation"}
          <textarea name="scopeExplanation" maxLength={5000} defaultValue={previous?.scopeExplanation ?? ""} />
        </label>
        <button className="button" disabled={pending}>
          {previous ? (ar ? "استبدال العرض أو إرساله مجددًا" : "Replace or resend quote") : (ar ? "إرسال عرض السعر" : "Send quote")}
        </button>
      </form>
      <button type="button" onClick={decline} disabled={pending}>{ar ? "رفض الطلب" : "Decline request"}</button>
      {message && <p role="status">{message}</p>}
    </section>
  );
}
