import { LuCake, LuMapPin, LuQuote, LuUtensils } from "react-icons/lu";
import type { Locale } from "@/lib/i18n/config";
import type { RequestSnapshot } from "@/lib/planner/request-snapshot";

type ScopeField = [label: string, value: string | number | null | undefined];

export function RequestScope({ details, locale, grouped = false }: {
  details: Partial<RequestSnapshot>;
  locale: Locale;
  grouped?: boolean;
}) {
  const ar = locale === "ar";
  const labels = details.catalogLabels;
  const custom = details.decorMode === "customize";
  const delegated = ar ? "يختار وناس" : "WANAS will choose";
  const profile: ScopeField[] = [
    [ar ? "نوع المناسبة" : "Event type", details.eventTypeOther || labels?.eventType?.[locale] || details.eventType],
    [ar ? "عدد الضيوف المتوقع" : "Estimated guests", details.guestCount],
  ];
  const location: ScopeField[] = [
    [ar ? "اسم المكان" : "Venue name", details.venueName],
    [ar ? "العنوان" : "Street address", details.streetAddress],
    [ar ? "نوع المكان" : "Venue type", details.venueTypeOther || labels?.venueType?.[locale] || details.venueType],
  ];
  const services: ScopeField[] = [
    [ar ? "الميزانية" : "Budget", labels?.budgetRange?.[locale] || details.budgetRange],
    [ar ? "الديكور" : "Decor", labels?.decorMode?.[locale] || details.decorMode],
    [ar ? "لوحة الإلهام" : "Moodboard", custom ? labels?.moodboard?.[locale] || details.moodboard || delegated : null],
    [ar ? "الألوان" : "Palette", custom ? labels?.palette?.[locale] || details.palette || delegated : null],
    [ar ? "درجات الألوان" : "Palette colors", custom ? details.paletteColors?.join(" · ") : null],
    [ar ? "عناصر الديكور" : "Decor elements", custom ?
      labels?.decorElements?.map((label) => label[locale]).join(ar ? "، " : ", ") || details.decorElements?.join(ar ? "، " : ", ") || delegated : null],
    [ar ? "الضيافة" : "Catering", details.cateringRequested ? labels?.cateringOption?.[locale] || details.cateringOption :
      ar ? "غير مطلوبة" : "Not requested"],
  ];
  const notesLabel = ar ? "ملاحظات" : "Notes";
  const fields = (items: ScopeField[]) =>
    items.filter(([, value]) => value != null && value !== "").map(([label, value]) => (
      <div key={label}><dt>{label}</dt><dd><bdi>{value}</bdi></dd></div>
    ));

  if (!grouped) {
    return <dl>{fields([...profile, ...location, ...services, [notesLabel, details.notes],
      [ar ? "روابط للإلهام" : "Inspiration links", details.inspirationLinks]])}</dl>;
  }

  const groups = [
    { id: "profile", title: ar ? "المناسبة والحضور" : "Event profile & scale", icon: LuCake, items: profile },
    { id: "location", title: ar ? "المكان والموقع" : "Location & setting", icon: LuMapPin, items: location },
    { id: "services", title: ar ? "الميزانية والخدمات" : "Budget & services", icon: LuUtensils, items: services },
  ];

  return (
    <>
      {groups.map(({ id, title, icon: Icon, items }) => {
        const entries = fields(items);
        return entries.length > 0 && (
          <section key={id} data-scope-group={id}>
            <h3><Icon aria-hidden="true" />{title}</h3>
            <dl>{entries}</dl>
          </section>
        );
      })}
      {details.notes && (
        <section data-scope-group="notes">
          <h3><LuQuote aria-hidden="true" />{notesLabel}</h3>
          <p dir="auto">{details.notes}</p>
        </section>
      )}
    </>
  );
}
