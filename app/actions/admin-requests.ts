"use server";

import { declineRequest, sendQuote, type QuoteInput } from "@/lib/server/admin/actions";

function failure(error: unknown) {
  const code = error instanceof Error ? error.message : "";
  switch (code) {
    case "AUTH_REQUIRED":
    case "ADMIN_REQUIRED":
    case "DATE_UNAVAILABLE":
    case "OFFERED_DATE_TOO_SOON":
    case "ORIGINAL_DATE_HOLD_TOO_LATE":
    case "REQUEST_NOT_ACTIONABLE":
      return { ok: false as const, code };
    default:
      return { ok: false as const, code: "INVALID_OR_UNAVAILABLE" as const };
  }
}

export async function sendQuoteAction(requestId: string, input: QuoteInput) {
  try {
    await sendQuote(requestId, input);
    return { ok: true as const };
  } catch (error) {
    return failure(error);
  }
}

export async function declineRequestAction(requestId: string) {
  try {
    await declineRequest(requestId);
    return { ok: true as const };
  } catch (error) {
    return failure(error);
  }
}
