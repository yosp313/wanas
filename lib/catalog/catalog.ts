export type Locale = "ar" | "en";

/** Catering fixtures are opt-in for tests only. */
export const catalogMode = process.env.NEXT_PUBLIC_WANAS_CATALOG_MODE === "fixtures" || process.env.WANAS_CATALOG_MODE === "fixtures" ? "fixtures" : "approved";

export type CatalogOption = {
  id: string;
  labels: Record<Locale, string>;
};

export const eventTypes: CatalogOption[] = [
  ["wedding", "Wedding", "زفاف"],
  ["katb-el-ketab", "Katb al-kitab", "كتب كتاب"],
  ["engagement", "Engagement", "خطوبة"],
  ["birthday", "Birthday", "عيد ميلاد"],
  ["anniversary", "Anniversary", "ذكرى سنوية"],
  ["private-dinner", "Private dinner", "عشاء خاص"],
  ["corporate", "Corporate event", "فعالية شركات"],
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
  ["under-50000", "Under EGP 50,000", "أقل من 50,000 جنيه"],
  ["50000-100000", "EGP 50,000–100,000", "50,000–100,000 جنيه"],
  ["100000-200000", "EGP 100,000–200,000", "100,000–200,000 جنيه"],
  ["over-200000", "Over EGP 200,000", "أكثر من 200,000 جنيه"],
].map(([id, en, ar]) => ({ id, labels: { en, ar } }));

export const decorModes: CatalogOption[] = [
  ["curate", "Let WANAS choose the decor", "نسّقوا الحفل لي"],
  ["customize", "Customize my decor", "أصمّم الديكور بنفسي"],
].map(([id, en, ar]) => ({ id, labels: { en, ar } }));

const moodboardOptions = [
  ["sunlit-terracotta", "terracotta", "Terracotta and olive", "تيراكوتا دافئة"],
  ["ivory-garden", "ivory", "Ivory and alabaster", "عاجي وألباستر"],
  ["midnight-candlelight", "emerald", "Emerald and gold", "زمرد على ضوء الشموع"],
  ["quiet-olive", "greenhouse", "Quiet olive", "زيتوني هادئ"],
  ["blush-pampas", "blush", "Blush and pampas grass", "وردي وعشب البامباس"],
] as const;

export const moodboards = moodboardOptions.map(([id, image, en, ar]) => ({ id, image, labels: { en, ar } }));

export const palettes = [
  { id: "terracotta-olive", labels: { en: "Terracotta & olive", ar: "تيراكوتا وزيتوني" }, colors: ["#c2652a", "#7a6e4f", "#e8dfd3"] },
  { id: "blush-sand", labels: { en: "Blush & sand", ar: "وردي رملي" }, colors: ["#c7919f", "#d8bcaa", "#8c5c65"] },
  { id: "champagne-ivory", labels: { en: "Champagne & ivory", ar: "شامبانيا وعاجي" }, colors: ["#c4a475", "#f8f6f0", "#e4d7c3"] },
  { id: "custom", labels: { en: "Custom palette", ar: "لوحة ألوان مخصّصة" }, colors: ["#b8775e", "#e8dfd3", "#4d5145"] },
];

export const decorElements: CatalogOption[] = [
  ["backdrop", "Backdrop", "خلفية"],
  ["florals", "Florals", "زهور"],
  ["table-styling", "Table styling", "تنسيق الطاولات"],
  ["lighting", "Lighting", "إضاءة"],
].map(([id, en, ar]) => ({ id, labels: { en, ar } }));

const fixtureCateringOptions: CatalogOption[] = [
  ["canapes", "Canapés", "مقبلات"],
  ["buffet", "Buffet", "بوفيه"],
  ["plated", "Plated dining", "عشاء مقدم"],
  ["recommend", "Recommend a format", "اقترحوا الأنسب"],
].map(([id, en, ar]) => ({ id, labels: { en, ar } }));

export const cateringOptions = catalogMode === "fixtures" ? fixtureCateringOptions : fixtureCateringOptions.filter((option) => option.id === "recommend");
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
