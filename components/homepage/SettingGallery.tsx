"use client";

import Image from "next/image";
import { useState } from "react";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import type { Locale } from "@/lib/i18n/config";
import styles from "./homepage.module.css";

const settings = [
  { image: "courtyard", en: "A courtyard reception", ar: "استقبال في الفناء" },
  { image: "kosha", en: "The ceremony setting", ar: "تنسيق الكوشة والمراسم" },
  { image: "feast", en: "Dinner under the lights", ar: "عشاء في الهواء الطلق" },
];

export function SettingGallery({ locale }: { locale: Locale }) {
  const [index, setIndex] = useState(0);
  const setting = settings[index];
  const ar = locale === "ar";
  const numbers = new Intl.NumberFormat(ar ? "ar-EG" : locale);
  const move = (amount: number) => setIndex((current) => (current + amount + settings.length) % settings.length);

  return (
    <figure className={styles.gallery}>
      <div className={styles.setting}>
        <Image key={setting.image} className="image-edge" src={`/atelier/home/${setting.image}.webp`} alt="" fill
          preload={index === 0} sizes="(max-width: 760px) 100vw, 55vw" />
      </div>
      <figcaption className={styles.caption}>
        <div aria-live="polite">
          <small dir="ltr">{numbers.format(index + 1)} / {numbers.format(settings.length)}</small>
          <span>{setting[locale]}</span>
        </div>
        <div className={styles.galleryActions}>
          <button type="button" aria-label={ar ? "المشهد السابق" : "Previous setting"} onClick={() => move(-1)}><LuChevronLeft aria-hidden="true" /></button>
          <button type="button" aria-label={ar ? "المشهد التالي" : "Next setting"} onClick={() => move(1)}><LuChevronRight aria-hidden="true" /></button>
        </div>
      </figcaption>
    </figure>
  );
}
