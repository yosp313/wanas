"use client";

import { useState, useTransition } from "react";
import { acceptQuote } from "@/lib/server/requests/actions";

export function AcceptQuoteButton({ requestId, quoteId }: { requestId: string; quoteId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  return <span><button disabled={pending} onClick={() => startTransition(async () => { try { await acceptQuote(requestId, quoteId); setMessage("Booking confirmed"); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to accept quote"); } })}>Accept quote</button>{message && <span role="status"> {message}</span>}</span>;
}
