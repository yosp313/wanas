"use client";

import { useState, useTransition } from "react";
import { requestBookingChange } from "@/lib/server/bookings/actions";

export function BookingChangeForm({ bookingId, revision }: { bookingId: string; revision: number }) {
  const [kind, setKind] = useState<"cancellation" | "reschedule" | "scope">("reschedule");
  const [newDate, setNewDate] = useState("");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  return <form onSubmit={(event) => { event.preventDefault(); startTransition(async () => { try { await requestBookingChange(bookingId, revision, { kind, newDate: kind === "reschedule" ? newDate : undefined, notes }); setMessage("Change request sent."); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to send request."); } }); }}>
    <label>Request type <select value={kind} onChange={(event) => setKind(event.target.value as typeof kind)}><option value="reschedule">Reschedule</option><option value="scope">Scope or price</option><option value="cancellation">Cancellation</option></select></label>
    {kind === "reschedule" && <label>New date <input type="date" value={newDate} onChange={(event) => setNewDate(event.target.value)} required /></label>}
    <label>Notes <textarea value={notes} onChange={(event) => setNotes(event.target.value)} /></label>
    <button type="submit" disabled={pending}>{pending ? "Sending…" : "Request change"}</button>
    {message && <p role="status">{message}</p>}
  </form>;
}
