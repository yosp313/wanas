import { z } from "zod";

const text = z.string().trim();
export const draftSchema = z.object({
  locale: z.enum(["ar", "en"]),
  eventType: text.min(1),
  eventTypeOther: text.max(200),
  guestCount: z.number().int().min(1).max(100_000),
  eventDate: z.iso.date(),
  venueName: text.min(1).max(200),
  streetAddress: text.min(1).max(500),
  venueType: text.min(1),
  venueTypeOther: text.max(200),
  budgetRange: text.min(1),
  decorMode: z.enum(["curate", "customize"]),
  moodboard: text.max(100),
  palette: text.max(100),
  decorElements: z.array(text).max(20),
  cateringRequested: z.boolean(),
  cateringOption: text.max(100),
  notes: text.max(5000),
  inspirationLinks: text.max(2000),
  customerName: text.min(1).max(200),
  mobile: text.regex(/^\+?[\p{Nd} ()-]{7,25}$/u).refine((value) => (value.match(/\p{Nd}/gu)?.length ?? 0) >= 7),
});

export function validInspirationLinks(value: string) {
  return value.trim().split(/\s+/).filter(Boolean).every((link) => {
    try {
      const { protocol } = new URL(link);
      return protocol === "https:" || protocol === "http:";
    } catch {
      return false;
    }
  });
}
