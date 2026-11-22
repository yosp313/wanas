import type { Locale } from "@/lib/catalog/catalog";

export type PlannerDraft = {
  eventType: string;
  eventTypeOther: string;
  guestCount: number | "";
  eventDate: string;
  venueName: string;
  streetAddress: string;
  venueType: string;
  venueTypeOther: string;
  budgetRange: string;
  decorMode: "curate" | "customize" | "";
  moodboard: string;
  palette: string;
  paletteColors: string[];
  decorElements: string[];
  cateringRequested: boolean;
  cateringOption: string;
  notes: string;
  inspirationLinks: string;
  customerName: string;
  mobile: string;
  locale: Locale;
};

export const emptyDraft = (locale: Locale): PlannerDraft => ({
  eventType: "", eventTypeOther: "", guestCount: "", eventDate: "", venueName: "", streetAddress: "", venueType: "", venueTypeOther: "", budgetRange: "", decorMode: "", moodboard: "", palette: "", paletteColors: [], decorElements: [], cateringRequested: false, cateringOption: "", notes: "", inspirationLinks: "", customerName: "", mobile: "", locale,
});
