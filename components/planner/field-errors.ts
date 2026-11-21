import { isCatalogId } from "@/lib/catalog/catalog";
import type { PlannerDraft } from "@/lib/planner/types";
import { draftSchema, validInspirationLinks } from "@/lib/planner/validation";

export const fieldsByStep = [
  ["eventType", "eventTypeOther", "guestCount", "venueType", "venueTypeOther", "venueName", "streetAddress", "budgetRange", "eventDate"],
  ["decorMode", "notes", "inspirationLinks"],
  [],
  ["customerName", "mobile"],
] as const;

const plannerFields = fieldsByStep.flat();
export type PlannerField = (typeof plannerFields)[number];

export function plannerFieldErrors(draft: PlannerDraft, minimumDate: string, bookedDates: string[]) {
  const ar = draft.locale === "ar";
  const text = (en: string, arabic: string) => ar ? arabic : en;
  const errors: Partial<Record<PlannerField, string>> = {};
  const result = draftSchema.safeParse(draft);

  if (!result.success) {
    for (const issue of result.error.issues) {
      const name = plannerFields.find((field) => field === issue.path[0]);
      if (!name) continue;
      if (issue.code === "too_big" && typeof issue.maximum === "number" && typeof draft[name] === "string") {
        errors[name] = text(`Use ${issue.maximum} characters or fewer.`, `استخدموا ${issue.maximum} حرفًا أو أقل.`);
      } else {
        errors[name] = text("Complete this field.", "أكملوا هذا الحقل.");
      }
    }
  }

  if (!isCatalogId("eventTypes", draft.eventType)) errors.eventType = text("Choose an event type.", "اختاروا نوع المناسبة.");
  if (!isCatalogId("venueTypes", draft.venueType)) errors.venueType = text("Choose a venue type.", "اختاروا نوع المكان.");
  if (!isCatalogId("budgetRanges", draft.budgetRange)) errors.budgetRange = text("Choose a budget range.", "اختاروا نطاق الميزانية.");
  if (errors.decorMode) errors.decorMode = text("Choose a decor direction.", "اختاروا اتجاه الديكور.");
  if (errors.guestCount) errors.guestCount = text("Enter a whole number from 1 to 100,000.", "أدخلوا عددًا صحيحًا من 1 إلى 100,000.");
  if (errors.mobile) errors.mobile = text("Enter a valid mobile number with at least 7 digits.", "أدخلوا رقم هاتف صحيحًا يحتوي على 7 أرقام على الأقل.");

  if (draft.eventType === "other" && !draft.eventTypeOther.trim()) {
    errors.eventTypeOther = text("Describe your event.", "صفوا المناسبة.");
  }
  if (draft.venueType === "other" && !draft.venueTypeOther.trim()) {
    errors.venueTypeOther = text("Describe the venue.", "صفوا المكان.");
  }
  if (!errors.inspirationLinks && !validInspirationLinks(draft.inspirationLinks)) {
    errors.inspirationLinks = text("Enter full links starting with https:// or http://, separated by spaces.", "أدخلوا روابط كاملة تبدأ بـ https:// أو http:// وافصلوا بينها بمسافات.");
  }

  if (errors.eventDate) errors.eventDate = text("Choose an event date.", "اختاروا تاريخ المناسبة.");
  else if (draft.eventDate < minimumDate) errors.eventDate = text("Choose a date at least 10 days away.", "اختاروا موعدًا بعد 10 أيام على الأقل.");
  else if (bookedDates.includes(draft.eventDate)) errors.eventDate = text("This date is already booked.", "هذا التاريخ محجوز بالفعل.");

  return errors;
}
