"use client";

import { useState, useTransition } from "react";
import { applyBookingChange, type BookingAgreement } from "@/lib/server/bookings/actions";

export function ApplyBookingChangeForm({ changeRequestId, revision, kind }: { changeRequestId: string; revision: number; kind: string }) {
  const [newTotal, setNewTotal] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  return <form onSubmit={(event) => { event.preventDefault(); const agreement: BookingAgreement = newTotal === "" ? {} : { totalEgp: Number(newTotal) }; startTransition(async () => { try { await applyBookingChange(changeRequestId, revision, agreement); setMessage("Change applied."); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to apply change."); } }); }}>
    {kind !== "cancellation" && <label>Agreed total (EGP) <input type="number" min="0" step="1" value={newTotal} onChange={(event) => setNewTotal(event.target.value)} /></label>}
    <button type="submit" disabled={pending}>{pending ? "Applying…" : "Apply agreement"}</button>
    {message && <p role="status">{message}</p>}
  </form>;
}
