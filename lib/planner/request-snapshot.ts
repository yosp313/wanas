import { catalogLabel, catalogMode, type Locale } from "@/lib/catalog/catalog";
import type { PlannerDraft } from "./types";

type Labels = Record<Locale, string>;
type ChoiceLabels = {
  eventType: Labels;
  venueType: Labels;
  budgetRange: Labels;
  decorMode: Labels;
  moodboard?: Labels;
  palette?: Labels;
  decorElements: Labels[];
  cateringOption?: Labels;
};

export type RequestSnapshot = Omit<PlannerDraft, "customerName" | "mobile" | "locale" | "paletteColors"> & {
  paletteColors?: string[];
  catalogVersion: string;
  submittedLocale: Locale;
  catalogLabels?: ChoiceLabels;
};

function labels(group: Parameters<typeof catalogLabel>[0], id: string): Labels {
  return { ar: catalogLabel(group, id, "ar"), en: catalogLabel(group, id, "en") };
}

export function requestSnapshot(draft: PlannerDraft): RequestSnapshot {
  const custom = draft.decorMode === "customize";
  return {
    catalogVersion: catalogMode === "fixtures" ? "fixtures-v1" : "launch-v1",
    submittedLocale: draft.locale,
    eventType: draft.eventType,
    eventTypeOther: draft.eventType === "other" ? draft.eventTypeOther.trim() : "",
    guestCount: draft.guestCount,
    eventDate: draft.eventDate,
    venueName: draft.venueName.trim(),
    streetAddress: draft.streetAddress.trim(),
    venueType: draft.venueType,
    venueTypeOther: draft.venueType === "other" ? draft.venueTypeOther.trim() : "",
    budgetRange: draft.budgetRange,
    decorMode: draft.decorMode,
    moodboard: custom ? draft.moodboard : "",
    palette: custom ? draft.palette : "",
    paletteColors: custom && draft.palette && draft.paletteColors.length ? draft.paletteColors : undefined,
    decorElements: custom ? draft.decorElements : [],
    cateringRequested: draft.cateringRequested,
    cateringOption: draft.cateringRequested ? draft.cateringOption : "",
    notes: draft.notes.trim(),
    inspirationLinks: draft.inspirationLinks.trim(),
    catalogLabels: {
      eventType: labels("eventTypes", draft.eventType),
      venueType: labels("venueTypes", draft.venueType),
      budgetRange: labels("budgetRanges", draft.budgetRange),
      decorMode: labels("decorModes", draft.decorMode),
      moodboard: custom && draft.moodboard ? labels("moodboards", draft.moodboard) : undefined,
      palette: custom && draft.palette ? labels("palettes", draft.palette) : undefined,
      decorElements: custom ? draft.decorElements.map((id) => labels("decorElements", id)) : [],
      cateringOption: draft.cateringRequested ? labels("cateringOptions", draft.cateringOption) : undefined,
    },
  };
}
