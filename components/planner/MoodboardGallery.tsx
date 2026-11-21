import { useState } from "react";
import Image from "next/image";
import { LuCheck, LuCircle, LuDiamond } from "react-icons/lu";
import { catalog, type Locale } from "@/lib/catalog/catalog";
import styles from "./planner.module.css";

const directions = [
  {
    id: "sunlit-terracotta",
    image: "terracotta",
    en: "Sun-baked terracotta & olive",
    profile: { en: "Earthy & sunlit", ar: "ترابي ومشرق" },
    ar: "تيراكوتا دافئة",
    colors: [
      { hex: "#c2652a", en: "Clay", ar: "طيني" },
      { hex: "#7a6e4d", en: "Olive", ar: "زيتوني" },
      { hex: "#e8dfd3", en: "Linen", ar: "كتاني" },
      { hex: "#b58d57", en: "Brass", ar: "نحاسي" },
    ],
  },
  {
    id: "ivory-garden",
    image: "ivory",
    en: "Celestial white & alabaster",
    profile: { en: "Luminous & airy", ar: "مشرق وخفيف" },
    ar: "عاجي وألباستر",
    colors: [
      { hex: "#f8f6f0", en: "Ivory", ar: "عاجي" },
      { hex: "#ded6c9", en: "Alabaster", ar: "ألباستر" },
      { hex: "#9e988f", en: "Stone", ar: "حجري" },
    ],
  },
  {
    id: "midnight-candlelight",
    image: "emerald",
    en: "Oud & gilded emerald",
    profile: { en: "Rich & intimate", ar: "فاخر وحميم" },
    ar: "زمرد على ضوء الشموع",
    colors: [
      { hex: "#1b3b2b", en: "Emerald", ar: "زمردي" },
      { hex: "#c9a050", en: "Gold", ar: "ذهبي" },
      { hex: "#3d271d", en: "Walnut", ar: "جوزي" },
    ],
  },
  {
    id: "quiet-olive",
    image: "greenhouse",
    en: "Quiet olive",
    profile: { en: "Soft & botanical", ar: "هادئ ونباتي" },
    ar: "زيتوني هادئ",
    colors: [
      { hex: "#566044", en: "Olive", ar: "زيتوني" },
      { hex: "#b7ae80", en: "Sage", ar: "أخضر مريمي" },
      { hex: "#e1cab1", en: "Sand", ar: "رملي" },
    ],
  },
  {
    id: "",
    image: "blush",
    en: "Blush dune & bohemian pampas",
    profile: { en: "Soft & modern", ar: "ناعم وعصري" },
    ar: "وردي وعشب البامباس",
    colors: [
      { hex: "#d9a291", en: "Blush", ar: "وردي فاتح" },
      { hex: "#e3d0c1", en: "Sand", ar: "رملي" },
      { hex: "#8c3c3c", en: "Rosewood", ar: "وردي داكن" },
    ],
  },
];

export function MoodboardGallery({
  locale,
  value,
  onChange,
}: {
  locale: Locale;
  value: string;
  onChange: (value: string) => void;
}) {
  const ar = locale === "ar";
  const [reference, setReference] = useState("terracotta");
  const options = catalog.moodboards;
  const cards = directions.filter((direction) =>
    options.length
      ? options.some((option) => option.id === direction.id)
      : direction.image !== "greenhouse",
  );
  const preview =
    cards.find((direction) =>
      options.length ? direction.id === value : direction.image === reference,
    ) ?? cards[0];
  const activeImage = options.length ? cards.find((direction) => direction.id === value)?.image : preview.image;
  const terracotta = preview.image === "terracotta";

  return (
    <section className={styles.moodSection} aria-labelledby="moodboard-title">
      <header className={styles.moodHeading}>
        <h2 id="moodboard-title" tabIndex={-1}>{ar ? "لوحات وناس المميزة" : "Signature moodboards"}</h2>
        {!options.length && (
          <p>{ar
            ? "استلهموا من هذه الأمثلة واذكروا ما أعجبكم في الملاحظات."
            : "Browse the references and tell us what you like in your notes."}</p>
        )}
      </header>
      <div className={styles.moodGrid}>
        {cards.map((direction, index) => {
          const label = (ar && options.find(({ id }) => id === direction.id)?.labels.ar) || direction[locale];
          const selected = activeImage === direction.image;
          return (
            <button
              type="button"
              key={direction.image}
              className={styles.moodTile}
              aria-label={label}
              aria-pressed={selected}
              aria-controls="moodboard-preview"
              onClick={() => options.length ? onChange(direction.id) : setReference(direction.image)}
            >
              <span className={styles.moodImage}>
                <Image src={`/atelier/${direction.image}.webp`} alt="" fill sizes="(max-width: 680px) 45vw, 25vw" />
                <span className={styles.moodCheck} aria-hidden="true">
                  {selected ? (
                    <>
                      <LuCheck size={14} />
                      {options.length ? (ar ? "مختارة" : "Selected") : (ar ? "معاينة" : "Previewing")}
                    </>
                  ) : <LuCircle size={12} />}
                </span>
                <span className={styles.moodImageMeta} aria-hidden="true">
                  <span>{ar ? "لوحة" : "Direction"} {String(index + 1).padStart(2, "0")}</span>
                  <span className={styles.swatches}>
                    {direction.colors.slice(0, 3).map(({ hex }) => <i key={hex} style={{ backgroundColor: hex }} />)}
                  </span>
                </span>
              </span>
              <span className={styles.moodCaption}>
                <strong>{label}</strong>
                <small>{direction.profile[locale]}</small>
              </span>
            </button>
          );
        })}
      </div>
      <section id="moodboard-preview" className={styles.moodPreview} aria-labelledby="moodboard-preview-title">
        <header>
          <p className={styles.eyebrow}>{ar ? "تفاصيل لوحة الإلهام" : "Moodboard breakdown"}</p>
          <h3 id="moodboard-preview-title" aria-live="polite">{preview[locale]}</h3>
        </header>
        <div className={styles.previewGrid}>
          <div className={styles.previewStack}>
            <section className={styles.previewCard}>
              <h4>{ar ? "تناغم الألوان" : "Color harmony"}</h4>
              <ul className={styles.palette}>
                {preview.colors.map((color) => (
                  <li key={color.hex}>
                    <div style={{ backgroundColor: color.hex }}><span dir="ltr">{color.hex}</span></div>
                    <strong>{color[locale]}</strong>
                  </li>
                ))}
              </ul>
              {terracotta && (
                <div className={styles.colorBalance}>
                  <i aria-hidden="true" />
                  <div>
                    <strong>{ar ? "توزيع الألوان" : "Suggested color balance"}</strong>
                    <p>{ar ? "٤٥٪ طيني، ٣٠٪ زيتوني، ٢٥٪ كتاني" : "45% terracotta · 30% olive · 25% linen"}</p>
                  </div>
                </div>
              )}
            </section>
            {terracotta && (
              <section className={styles.previewCard}>
                <h4>{ar ? "الخامات والملمس" : "Materials & textures"}</h4>
                <ul className={styles.materials}>
                  {(ar ? ["حجر ترافرتين", "كتان خام", "طين مشغول يدويًا", "شمع طبيعي"]
                    : ["Fluted travertine", "Raw linen", "Hand-thrown clay", "Taper candles"]
                  ).map((material) => <li key={material}><LuDiamond size={12} aria-hidden="true" />{material}</li>)}
                </ul>
              </section>
            )}
          </div>
          <div className={styles.previewStack}>
            <div className={styles.previewCard}>
              <figure className={styles.previewHero}>
                <Image
                  src={`/atelier/${terracotta ? "kosha" : preview.image}.webp`}
                  alt=""
                  fill
                  sizes="(max-width: 800px) 90vw, 50vw"
                />
                <figcaption>
                  <small>{ar ? "تنسيق المكان" : "Spatial styling"}</small>
                  {terracotta ? ar ? "كوشة بتنسيق بسيط وغير متماثل" : "Asymmetric ceremony backdrop" : preview[locale]}
                </figcaption>
              </figure>
              {terracotta && (
                <div className={styles.previewDetails}>
                  <div>
                    <Image src="/atelier/centerpiece.webp" alt="" width={64} height={56} />
                    <span><small>{ar ? "تنسيق الطاولة" : "Tablescape"}</small>{ar ? "زهور طاولة منخفضة" : "Low floral centerpieces"}</span>
                  </div>
                  <div>
                    <Image src="/atelier/lighting.webp" alt="" width={64} height={56} />
                    <span><small>{ar ? "الإضاءة" : "Lighting"}</small>{ar ? "إضاءة شموع دافئة" : "Warm candlelight"}</span>
                  </div>
                </div>
              )}
            </div>
            {terracotta && (
              <div className={styles.stylingNotes}>
                <strong>{ar ? "لمسات التنسيق" : "Styling notes"}</strong>
                <span>{ar ? "ضوء الغروب" : "Golden-hour light"}</span>
                <span>{ar ? "أغصان الزيتون" : "Olive branches"}</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </section>
  );
}
