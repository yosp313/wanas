export type Locale = "ar" | "en";

/** The launch catalog is supplied by WANAS. Fixtures are opt-in for tests only. */
export const catalogMode = process.env.NEXT_PUBLIC_WANAS_CATALOG_MODE === "fixtures" || process.env.WANAS_CATALOG_MODE === "fixtures" ? "fixtures" : "approved";

export type CatalogOption = {
  id: string;
  labels: Record<Locale, string>;
};

export const eventTypes: CatalogOption[] = [
  ["wedding", "Wedding", "زفاف"],
  ["katb-el-ketab", "Katb El-Ketab", "كتب كتاب"],
  ["engagement", "Engagement", "خطوبة"],
  ["birthday", "Birthday", "عيد ميلاد"],
  ["anniversary", "Anniversary", "ذكرى سنوية"],
  ["private-dinner", "Private Dinner", "عشاء خاص"],
  ["corporate", "Corporate Event", "فعالية شركات"],
  ["other", "Other", "أخرى"],
].map(([id, en, ar]) => ({ id, labels: { en, ar } }));

export const venueTypes: CatalogOption[] = [
  ["apartment", "Apartment", "شقة"],
  ["villa", "Villa", "فيلا"],
  ["garden", "Garden", "حديقة"],
  ["hall", "Hall", "قاعة"],
  ["hotel", "Hotel", "فندق"],
  ["other", "Other", "أخرى"],
].map(([id, en, ar]) => ({ id, labels: { en, ar } }));

export const budgetRanges: CatalogOption[] = [
  ["under-50000", "Under EGP 50,000", "أقل من ٥٠٬٠٠٠ جنيه"],
  ["50000-100000", "EGP 50,000–100,000", "٥٠٬٠٠٠–١٠٠٬٠٠٠ جنيه"],
  ["100000-200000", "EGP 100,000–200,000", "١٠٠٬٠٠٠–٢٠٠٬٠٠٠ جنيه"],
  ["over-200000", "Over EGP 200,000", "أكثر من ٢٠٠٬٠٠٠ جنيه"],
].map(([id, en, ar]) => ({ id, labels: { en, ar } }));

export const decorModes: CatalogOption[] = [
  ["curate", "Curate it for me", "نسّقوا الحفل لي"],
  ["customize", "Customize my decor", "أصمّم الديكور بنفسي"],
].map(([id, en, ar]) => ({ id, labels: { en, ar } }));

const fixtureMoodboards: CatalogOption[] = [
  ["sunlit-terracotta", "Sunlit terracotta", "تيراكوتا دافئة"],
  ["quiet-olive", "Quiet olive", "زيتوني هادئ"],
  ["ivory-garden", "Ivory garden", "حديقة عاجية"],
  ["midnight-candlelight", "Midnight candlelight", "ضوء شموع ليلي"],
].map(([id, en, ar]) => ({ id, labels: { en, ar } }));

const fixturePalettes: CatalogOption[] = [
  ["terracotta-olive", "Terracotta & olive", "تيراكوتا وزيتوني"],
  ["blush-sand", "Blush & sand", "وردي رملي"],
  ["champagne-ivory", "Champagne & ivory", "شامبانيا وعاجي"],
  ["custom", "A different palette", "ألوان أخرى"],
].map(([id, en, ar]) => ({ id, labels: { en, ar } }));

const fixtureDecorElements: CatalogOption[] = [
  ["backdrop", "Backdrop", "خلفية"],
  ["florals", "Florals", "زهور"],
  ["table-styling", "Table styling", "تنسيق الطاولات"],
].map(([id, en, ar]) => ({ id, labels: { en, ar } }));

const fixtureCateringOptions: CatalogOption[] = [
  ["canapes", "Canapés", "مقبلات"],
  ["buffet", "Buffet", "بوفيه"],
  ["plated", "Plated dining", "عشاء مقدم"],
  ["recommend", "Recommend a format", "اقترحوا الأنسب"],
].map(([id, en, ar]) => ({ id, labels: { en, ar } }));

// These sample options are deliberately absent from a plain production build
// until WANAS supplies the approved launch catalog. CI and local demos opt in
// with WANAS_CATALOG_MODE=fixtures (and NEXT_PUBLIC_WANAS_CATALOG_MODE for UI).
export const moodboards = catalogMode === "fixtures" ? fixtureMoodboards : [];
export const palettes = catalogMode === "fixtures" ? fixturePalettes : [];
export const decorElements = catalogMode === "fixtures" ? fixtureDecorElements : [];
export const cateringOptions = catalogMode === "fixtures" ? fixtureCateringOptions : [];
export const catalog = { eventTypes, venueTypes, budgetRanges, decorModes, moodboards, palettes, decorElements, cateringOptions } as const;

export function assertCatalogMode() {
  if (catalogMode !== "fixtures" && process.env.NODE_ENV === "test") throw new Error("WANAS_CATALOG_MODE must be fixtures in tests that use sample catalog options");
}

export function isCatalogId(group: keyof typeof catalog, id: unknown): id is string {
  return typeof id === "string" && catalog[group].some((option) => option.id === id);
}

export function catalogLabel(group: keyof typeof catalog, id: string, locale: Locale): string {
  return catalog[group].find((option) => option.id === id)?.labels[locale] ?? id;
}
