"use client";

import { useState, useTransition } from "react";
import { declineRequest, sendQuote } from "@/lib/server/admin/actions";

export function AdminRequestActions({ requestId }: { requestId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  return <section>
    <form action={(formData) => startTransition(async () => { try { await sendQuote(requestId, { offeredDate: String(formData.get("offeredDate")), services: String(formData.get("services")), totalEgp: Number(formData.get("totalEgp")), scopeExplanation: String(formData.get("scopeExplanation") ?? "") }); setMessage("Quote sent"); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to send quote"); } })}>
      <label>Offered date <input name="offeredDate" type="date" required /></label>
      <label>Services <textarea name="services" required /></label>
      <label>Total EGP <input name="totalEgp" type="number" min="0" required /></label>
      <label>Scope explanation <textarea name="scopeExplanation" /></label>
      <button disabled={pending}>Send quote</button>
    </form>
    <button disabled={pending} onClick={() => startTransition(async () => { try { await declineRequest(requestId); setMessage("Request declined"); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to decline request"); } })}>Decline request</button>
    {message && <p role="status">{message}</p>}
  </section>;
}
