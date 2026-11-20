import type { Locale } from "@/lib/catalog/catalog";
import type { PlannerDraft } from "./types";

export type RequestSnapshot = Omit<PlannerDraft, "customerName" | "mobile" | "locale"> & {
  catalogVersion: "launch-v1";
  submittedLocale: Locale;
};

export function requestSnapshot(draft: PlannerDraft): RequestSnapshot {
  const details = { ...draft } as Partial<PlannerDraft>;
  delete details.customerName;
  delete details.mobile;
  const locale = details.locale!;
  delete details.locale;
  return { ...details as Omit<PlannerDraft, "customerName" | "mobile" | "locale">, catalogVersion: "launch-v1", submittedLocale: locale };
}
