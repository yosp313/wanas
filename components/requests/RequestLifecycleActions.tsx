"use client";

import { useState, useTransition } from "react";
import { declineQuote, withdrawRequest } from "@/lib/server/requests/actions";

export function RequestLifecycleActions({ requestId, quoteId, canDeclineQuote, canWithdraw }: { requestId: string; quoteId?: string; canDeclineQuote?: boolean; canWithdraw?: boolean }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  return <span>
    {canDeclineQuote && quoteId && <button disabled={pending} onClick={() => startTransition(async () => { try { await declineQuote(requestId, quoteId); setMessage("Quote declined"); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to decline quote"); } })}>Decline quote</button>}
    {canWithdraw && <button disabled={pending} onClick={() => startTransition(async () => { try { await withdrawRequest(requestId); setMessage("Request withdrawn"); } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to withdraw request"); } })}>Withdraw request</button>}
    {message && <span role="status"> {message}</span>}
  </span>;
}
