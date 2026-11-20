"use server";

import { acceptQuote, declineQuote, withdrawRequest } from "@/lib/server/requests/actions";

function responseError(error: unknown): "AUTH_REQUIRED" | "QUOTE_EXPIRED" | "QUOTE_CHANGED" | "UNAVAILABLE" {
  const code = error instanceof Error ? error.message : "";
  switch (code) {
    case "AUTH_REQUIRED":
      return "AUTH_REQUIRED";
    case "QUOTE_EXPIRED":
    case "QUOTE_HOLD_EXPIRED":
      return "QUOTE_EXPIRED";
    case "QUOTE_NOT_ACCEPTABLE":
    case "QUOTE_NOT_DECLINABLE":
    case "QUOTE_NOT_FOUND":
      return "QUOTE_CHANGED";
    default:
      return "UNAVAILABLE";
  }
}

export async function respondToQuote(requestId: string, quoteId: string, response: "accept" | "decline") {
  try {
    if (response === "accept") await acceptQuote(requestId, quoteId);
    else if (response === "decline") await declineQuote(requestId, quoteId);
    else return { ok: false as const, error: "UNAVAILABLE" as const };
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: responseError(error) };
  }
}

export async function withdrawRequestAction(requestId: string) {
  try {
    await withdrawRequest(requestId);
    return { ok: true as const };
  } catch (error) {
    return { ok: false as const, error: responseError(error) };
  }
}
