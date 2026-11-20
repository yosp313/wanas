"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitBookingAgreement } from "@/app/actions/booking-changes";
import type { BookingAgreement } from "@/lib/server/bookings/actions";

const messages: Record<string, string> = { STALE_BOOKING_REVISION: "The booking changed. Review the current revision.", BOOKING_CHANGE_CUTOFF_PASSED: "The booking change cutoff has passed.", DATE_UNAVAILABLE: "The requested date is unavailable.", DESTINATION_TOO_SOON: "The new date needs at least 10 days' notice." };

export function ApplyBookingChangeForm({ changeRequestId, revision, requestedRevision, kind, locale = "en" }: { changeRequestId: string; revision: number; requestedRevision: number; kind: string; locale?: "ar" | "en" }) {
  const router = useRouter();
  const [newTotal, setNewTotal] = useState("");
  const [scopeExplanation, setScopeExplanation] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const requiresReview = requestedRevision !== revision;
  return <form onSubmit={(event) => { event.preventDefault(); if (requiresReview && !reviewed) { setMessage(locale === "ar" ? "أكدت مراجعة الإصدار الحالي أولاً." : "Confirm that you reviewed the current revision."); return; } const agreement: BookingAgreement = { ...(newTotal === "" ? {} : { totalEgp: Number(newTotal) }), ...(scopeExplanation.trim() === "" ? {} : { scopeExplanation: scopeExplanation.trim() }) }; startTransition(async () => { const result = await submitBookingAgreement(changeRequestId, revision, agreement); if (result.ok) { setMessage(locale === "ar" ? "تم تطبيق الاتفاق." : "Change applied."); router.refresh(); } else setMessage(messages[result.code] ?? (locale === "ar" ? "تعذر تطبيق الاتفاق." : "Unable to apply change.")); }); }}>
    {requiresReview && <label><input type="checkbox" checked={reviewed} onChange={(event) => setReviewed(event.target.checked)} /> {locale === "ar" ? "راجعت إصدار الحجز الحالي" : "I reviewed the current booking revision"}</label>}
    {kind !== "cancellation" && <><label>{locale === "ar" ? "الإجمالي المتفق عليه (جنيه)" : "Agreed total (EGP)"} <input type="number" min="0" step="1" value={newTotal} onChange={(event) => setNewTotal(event.target.value)} /></label><label>{locale === "ar" ? "النطاق المتفق عليه" : "Agreed scope"} <textarea value={scopeExplanation} onChange={(event) => setScopeExplanation(event.target.value)} /></label></>}
    <button type="submit" disabled={pending}>{pending ? (locale === "ar" ? "جارٍ التطبيق…" : "Applying…") : "Apply agreement"}</button>
    {message && <p role="status">{message}</p>}
  </form>;
}
