"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { respondToQuote } from "@/app/actions/request-response";
import type { Locale } from "@/lib/i18n/config";

const errors = {
  AUTH_REQUIRED: ["Sign in to continue.", "سجّل الدخول للمتابعة."],
  QUOTE_EXPIRED: ["This quote has expired.", "انتهت صلاحية العرض."],
  QUOTE_CHANGED: ["This quote is no longer available.", "هذا العرض غير متاح الآن."],
  UNAVAILABLE: ["Unable to accept the quote. Try again.", "تعذر قبول العرض. حاول مجددًا."],
};

export function AcceptQuoteButton({ requestId, quoteId, locale }: { requestId: string; quoteId: string; locale: Locale }) {
  const ar = locale === "ar";
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  return (
    <span>
      <button className="button" disabled={pending} type="button" onClick={() => startTransition(async () => {
        const result = await respondToQuote(requestId, quoteId, "accept");
        setMessage(result.ok ? (ar ? "تم تأكيد الحجز" : "Booking confirmed") : errors[result.error][ar ? 1 : 0]);
        if (result.ok) router.refresh();
      })}>{ar ? "قبول العرض" : "Accept quote"}</button>
      {message && <span role="status"> {message}</span>}
    </span>
  );
}
