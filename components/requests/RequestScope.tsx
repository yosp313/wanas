import type { Locale } from "@/lib/i18n/config";
import type { RequestSnapshot } from "@/lib/planner/request-snapshot";

export function RequestScope({ details, locale }: { details: RequestSnapshot; locale: Locale }) {
  const ar = locale === "ar";
  const labels = details.catalogLabels;
  const custom = details.decorMode === "customize";
  const delegated = ar ? "يختار وناس" : "WANAS will choose";
  const fields = [
    [ar ? "نوع المناسبة" : "Event type", details.eventTypeOther || labels?.eventType[locale] || details.eventType],
    [ar ? "عدد الضيوف المتوقع" : "Estimated guests", details.guestCount],
    [ar ? "اسم المكان" : "Venue name", details.venueName],
    [ar ? "العنوان" : "Street address", details.streetAddress],
    [ar ? "نوع المكان" : "Venue type", details.venueTypeOther || labels?.venueType[locale] || details.venueType],
    [ar ? "الميزانية" : "Budget", labels?.budgetRange[locale] || details.budgetRange],
    [ar ? "الديكور" : "Decor", labels?.decorMode[locale] || details.decorMode],
    [ar ? "لوحة الإلهام" : "Moodboard", custom ? labels?.moodboard?.[locale] || details.moodboard || delegated : null],
    [ar ? "الألوان" : "Palette", custom ? labels?.palette?.[locale] || details.palette || delegated : null],
    [ar ? "عناصر الديكور" : "Decor elements", custom ?
      labels?.decorElements.map((label) => label[locale]).join(", ") || details.decorElements?.join(", ") || delegated : null],
    [ar ? "الضيافة" : "Catering", details.cateringRequested ? labels?.cateringOption?.[locale] || details.cateringOption :
      ar ? "غير مطلوبة" : "Not requested"],
    [ar ? "ملاحظات" : "Notes", details.notes],
    [ar ? "روابط للإلهام" : "Inspiration links", details.inspirationLinks],
  ];
  return (
    <dl>
      {fields.filter(([, value]) => value != null && value !== "").map(([label, value]) => (
        <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
      ))}
    </dl>
  );
}
