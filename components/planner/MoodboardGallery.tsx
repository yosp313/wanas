import { useState } from "react";
import Image from "next/image";
import { catalog, type Locale } from "@/lib/catalog/catalog";
import styles from "./planner.module.css";

const directions = [
  {
    id: "sunlit-terracotta",
    image: "terracotta",
    en: "Sun-baked terracotta",
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
    en: "Ivory & alabaster",
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
    en: "Emerald by candlelight",
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
    en: "Blush & pampas",
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
  const activeImage = options.length && !value ? "" : preview.image;
  const terracotta = preview.image === "terracotta";

  return (
    <section className={styles.moodSection} aria-labelledby="moodboard-title">
      <h2 id="moodboard-title">{ar ? "لوحات الإلهام" : "Moodboards"}</h2>
      {!options.length && (
        <p>
          {ar
            ? "استلهموا من هذه الأمثلة واذكروا ما أعجبكم في الملاحظات."
            : "Browse these references and tell us what you like in your notes."}
        </p>
      )}
      <div className={styles.moodGrid}>
        {cards.map((direction) => {
          const option = options.find(({ id }) => id === direction.id);
          const label = option?.labels[locale] ?? direction[locale];
          const selected = activeImage === direction.image;
          const content = (
            <>
              <span className={styles.moodImage}>
                <Image
                  src={`/atelier/${direction.image}.webp`}
                  alt=""
                  fill
                  sizes="(max-width: 760px) 45vw, 25vw"
                />
                {selected && (
                  <span className={styles.moodCheck} aria-hidden="true">
                    ✓
                  </span>
                )}
              </span>
              <span className={styles.moodCaption}>
                <span>{label}</span>
                <span className={styles.swatches} aria-hidden="true">
                  {direction.colors.slice(0, 3).map(({ hex }) => (
                    <i key={hex} style={{ backgroundColor: hex }} />
                  ))}
                </span>
              </span>
            </>
          );
          return (
            <button
              type="button"
              key={direction.image}
              className={styles.moodTile}
              aria-pressed={selected}
              aria-controls="moodboard-preview"
              onClick={() =>
                option ? onChange(direction.id) : setReference(direction.image)
              }
            >
              {content}
            </button>
          );
        })}
      </div>
      <div id="moodboard-preview" className={styles.moodPreview}>
        <div>
          <p className={styles.eyebrow}>
            {ar ? "ألوان وتفاصيل" : "Palette & details"}
          </p>
          <h3>{preview[locale]}</h3>
          <div
            className={styles.palette}
            aria-label={ar ? "ألوان اللوحة" : "Moodboard colors"}
          >
            {preview.colors.map((color) => (
              <div key={color.hex}>
                <i style={{ backgroundColor: color.hex }} aria-hidden="true" />
                <span>{color[locale]}</span>
              </div>
            ))}
          </div>
          {terracotta && (
            <div className={styles.materials}>
              <span>{ar ? "طين مشغول يدويًا" : "Hand-thrown clay"}</span>
              <span>{ar ? "كتان خام" : "Raw linen"}</span>
              <span>{ar ? "أغصان زيتون" : "Olive branches"}</span>
            </div>
          )}
        </div>
        <div>
          <figure>
            <div className={styles.previewHero}>
              <Image
                src={`/atelier/${terracotta ? "kosha" : preview.image}.webp`}
                alt=""
                fill
                sizes="(max-width: 760px) 90vw, 50vw"
              />
            </div>
            <figcaption>
              {terracotta
                ? ar
                  ? "تنسيق الكوشة"
                  : "Ceremony backdrop"
                : preview[locale]}
            </figcaption>
          </figure>
          {terracotta && (
            <div className={styles.previewDetails}>
              <div>
                <Image
                  src="/atelier/centerpiece.webp"
                  alt=""
                  width={72}
                  height={56}
                />
                <span>{ar ? "زهور الطاولة" : "Low floral centerpieces"}</span>
              </div>
              <div>
                <Image
                  src="/atelier/lighting.webp"
                  alt=""
                  width={72}
                  height={56}
                />
                <span>{ar ? "إضاءة الشموع" : "Warm candlelight"}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
