import { useState, type PointerEvent } from "react";
import type { Locale } from "@/lib/catalog/catalog";
import styles from "./planner.module.css";

function wheelColor(hue: number) {
  const channel = (offset: number) => {
    const position = (offset + hue / 60) % 6;
    const intensity = Math.max(0, Math.min(position, 4 - position, 1));
    return Math.round(255 * (1 - intensity)).toString(16).padStart(2, "0");
  };
  return `#${channel(5)}${channel(3)}${channel(1)}`;
}

export function PaletteEditor({ colors, defaults, locale, onChange }: {
  colors: string[];
  defaults: string[];
  locale: Locale;
  onChange: (colors: string[]) => void;
}) {
  const [active, setActive] = useState(0);
  const ar = locale === "ar";
  const swatches = colors.length === defaults.length ? colors : defaults;
  const labels = ar ? ["الأساسي", "الثانوي", "الإبراز"] : ["Primary", "Secondary", "Accent"];

  function setColor(color: string) {
    onChange(swatches.map((swatch, index) => index === active ? color : swatch));
  }

  function pickHue(event: PointerEvent<HTMLDivElement>) {
    const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - left - width / 2;
    const y = event.clientY - top - height / 2;
    if (Math.hypot(x, y) < width * 0.29) return;
    const degrees = Math.atan2(x, -y) * 180 / Math.PI;
    setColor(wheelColor((degrees + 360) % 360));
  }

  return (
    <div className={styles.paletteEditor}>
      <div className={styles.paletteSlots}>
        {swatches.map((color, index) => (
          <button key={labels[index]} type="button" aria-pressed={active === index} onClick={() => setActive(index)}>
            <i style={{ backgroundColor: color }} aria-hidden="true" />
            {labels[index]}
            <bdi>{color}</bdi>
          </button>
        ))}
      </div>
      <div className={styles.colorControls}>
        <div
          className={styles.colorWheel}
          aria-hidden="true"
          onPointerDown={(event) => {
            if (!event.isPrimary || event.button !== 0) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            pickHue(event);
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) pickHue(event);
          }}
        >
          <i style={{ backgroundColor: swatches[active] }} />
        </div>
        <div>
          <label className={styles.shadePicker}>
            {ar ? "ضبط درجة اللون" : "Fine-tune shade"}
            <input type="color" value={swatches[active]} onChange={(event) => setColor(event.target.value)} />
          </label>
          <button type="button" className={styles.resetPalette}
            disabled={swatches.every((color, index) => color === defaults[index])}
            onClick={() => onChange(defaults)}>
            {ar ? "استعادة الألوان الأصلية" : "Reset palette"}
          </button>
        </div>
      </div>
    </div>
  );
}
