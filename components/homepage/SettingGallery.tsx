"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { LuChevronLeft, LuChevronRight, LuPause, LuPlay } from "react-icons/lu";
import type { Locale } from "@/lib/i18n/config";
import type { GallerySlide } from "./content";
import styles from "./homepage.module.css";

export function SettingGallery({ locale, slides, label, hero = false, children }: {
  locale: Locale;
  slides: GallerySlide[];
  label: string;
  hero?: boolean;
  children?: ReactNode;
}) {
  const gallery = useRef<HTMLElement>(null);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [canRotate, setCanRotate] = useState(false);
  const ar = locale === "ar";
  const language = ar ? 1 : 0;
  const rotating = canRotate && !paused;

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncMotion = () => setCanRotate(!reducedMotion.matches);
    syncMotion();
    reducedMotion.addEventListener("change", syncMotion);
    return () => reducedMotion.removeEventListener("change", syncMotion);
  }, []);

  useEffect(() => {
    const element = gallery.current;
    if (!rotating || !element) return;
    const hover = window.matchMedia("(hover: hover) and (pointer: fine)");
    const hoverArea = hero ? ":hover" : `:has(.${styles.galleryActions}:hover)`;
    const timer = window.setInterval(() => {
      if (document.hidden || element.matches(":focus-within")) return;
      if (hover.matches && element.matches(hoverArea)) return;
      const { top, bottom } = element.getBoundingClientRect();
      if (bottom <= 0 || top >= window.innerHeight) return;
      setIndex((current) => (current + 1) % slides.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [hero, rotating, slides.length]);

  function move(direction: number) {
    setIndex((current) => (current + direction + slides.length) % slides.length);
    setPaused(true);
  }

  return (
    <figure ref={gallery} aria-label={label} className={`${styles.gallery} ${hero ? styles.heroGallery : styles.venueGallery}`}>
      <div className={styles.setting}>
        {slides.map((slide, position) => (
          <div key={slide.image} className={styles.slide} data-active={index === position}>
            <Image className="image-edge" src={`/atelier/home/${slide.image}.webp`} alt="" fill
              loading={hero && position === 0 ? "eager" : "lazy"}
              fetchPriority={hero && position === 0 ? "high" : undefined}
              sizes={hero ? "(max-width: 760px) 100vw, 54vw" : "(max-width: 760px) 1000px, 100vw"} />
          </div>
        ))}
      </div>
      <figcaption className={styles.caption}>
        {children}
        <div className={styles.slideCopy} aria-live={rotating ? "off" : "polite"}>
          {slides.map((slide, position) => (
            <div key={slide.image} aria-hidden={index !== position}>
              <span>{slide.title[language]}</span>
              {slide.description && <p>{slide.description[language]}</p>}
            </div>
          ))}
        </div>
        <div className={styles.galleryActions}>
          {!hero && (
            <button type="button" className={styles.slideArrow}
              aria-label={ar ? "المكان السابق" : "Previous venue"} onClick={() => move(-1)}>
              <LuChevronLeft aria-hidden="true" />
            </button>
          )}
          {slides.map((slide, position) => (
            <button key={slide.image} type="button" className={styles.slideDot}
              aria-label={slide.title[language]} aria-current={index === position}
              onClick={() => { setIndex(position); setPaused(true); }}>
              <span />
            </button>
          ))}
          {!hero && (
            <button type="button" className={styles.slideArrow}
              aria-label={ar ? "المكان التالي" : "Next venue"} onClick={() => move(1)}>
              <LuChevronRight aria-hidden="true" />
            </button>
          )}
          <button type="button" className={styles.rotation} hidden={!canRotate}
            aria-label={paused ? (ar ? "تشغيل عرض الصور" : "Play slideshow") : (ar ? "إيقاف عرض الصور مؤقتًا" : "Pause slideshow")}
            onClick={() => setPaused(!paused)}>
            {paused ? <LuPlay aria-hidden="true" /> : <LuPause aria-hidden="true" />}
          </button>
        </div>
      </figcaption>
    </figure>
  );
}
