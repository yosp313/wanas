"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acceptQuote } from "@/lib/server/requests/actions";

type Locale = "ar" | "en";
type ActionState = { status: "idle" | "success" | "error"; message: string };
const copy: Record<Locale, { accept: string; success: string; error: string }> = { en: { accept: "Accept quote", success: "Booking confirmed", error: "Unable to accept quote" }, ar: { accept: "قبول العرض", success: "تم تأكيد الحجز", error: "تعذر قبول العرض" } };

export function AcceptQuoteButton({ requestId, quoteId, locale = "en" }: { requestId: string; quoteId: string; locale?: Locale }) {
  const [pending, startTransition] = useTransition();
  const [state, setState] = useState<ActionState>({ status: "idle", message: "" }); const router = useRouter(); const text = copy[locale];
  return <span><button disabled={pending} onClick={() => startTransition(async () => { try { await acceptQuote(requestId, quoteId); setState({ status: "success", message: text.success }); router.refresh(); } catch (error) { setState({ status: "error", message: error instanceof Error ? error.message : text.error }); } })}>{text.accept}</button>{state.status !== "idle" && <span role="status"> {state.message}</span>}</span>;
}
