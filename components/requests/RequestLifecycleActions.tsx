"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { respondToQuote, withdrawRequestAction } from "@/app/actions/request-response";
import type { Locale } from "@/lib/i18n/config";

const errors = {
  AUTH_REQUIRED: ["Sign in to continue.", "سجّل الدخول للمتابعة."],
  QUOTE_EXPIRED: ["This quote has expired.", "انتهت صلاحية العرض."],
  QUOTE_CHANGED: ["This offer has changed. Refresh to see the latest quote.", "تغير العرض. حدّث الصفحة لرؤية أحدث عرض."],
  UNAVAILABLE: ["This action is unavailable. Refresh and try again.", "هذه العملية غير متاحة. حدّث الصفحة وحاول مجددًا."],
};

export function RequestLifecycleActions({
  locale, requestId, quoteId,
}: {
  locale: Locale;
  requestId: string;
  quoteId?: string;
}) {
  const ar = locale === "ar";
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  return (
    <span>
      <button type="button" disabled={pending} onClick={() => startTransition(async () => {
        const result = quoteId ? await respondToQuote(requestId, quoteId, "decline") : await withdrawRequestAction(requestId);
        if (!result.ok) {
          setMessage(errors[result.error][ar ? 1 : 0]);
          return;
        }
        setMessage(quoteId ? (ar ? "تم رفض العرض." : "Quote declined.") : (ar ? "تم سحب الطلب." : "Request withdrawn."));
        router.refresh();
      })}>
        {quoteId ? (ar ? "رفض العرض" : "Decline quote") : (ar ? "سحب الطلب" : "Withdraw request")}
      </button>
      {message && <span role="status"> {message}</span>}
    </span>
  );
}
