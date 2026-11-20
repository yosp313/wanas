"use server";

import { submitRequest } from "@/lib/server/requests/submit";
import type { PlannerDraft } from "@/lib/planner/types";

export async function submitRequestAction(draft: PlannerDraft, submissionId: string) {
  try { return { ok: true as const, result: await submitRequest(draft, submissionId) }; }
  catch (error) {
    const code = error instanceof Error ? error.message : "REQUEST_FAILED";
    if (code === "AUTH_REQUIRED" || code === "AUTH_EMAIL_REQUIRED") return { ok: false as const, error: "AUTH_REQUIRED" as const };
    if (code.startsWith("VALIDATION:")) return { ok: false as const, error: code.slice(11) };
    if (code.includes("unavailable")) return { ok: false as const, error: "DATE_UNAVAILABLE" as const };
    return { ok: false as const, error: "REQUEST_FAILED" as const };
  }
}
