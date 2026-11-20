import Image from "next/image";
import Link from "next/link";
import { catalogMode, type Locale } from "@/lib/catalog/catalog";
import styles from "./homepage.module.css";

const examples = [
  { image: "terracotta", en: "Sunlit terracotta", ar: "دفء التيراكوتا" },
  { image: "garden", en: "A quiet garden", ar: "حديقة هادئة" },
  { image: "candlelight", en: "Dinner at dusk", ar: "عشاء عند الغروب" },
];

export function Homepage({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  return (
    <main className={styles.home}>
      <section className={styles.hero}>
        <h1>{ar ? "احتفالات تشبهكم" : "A celebration that feels like you"}</h1>
        <p>{ar ? "ننسّق ديكور المناسبات والضيافة في القاهرة." : "Event decor and optional catering in Cairo."}</p>
        <Link className={styles.cta} href={`/${locale}/plan`}>{ar ? "خططوا حفلكم" : "Plan your event"}</Link>
      </section>
      {catalogMode === "fixtures" && (
        <section className={styles.gallery} aria-label={ar ? "أمثلة من الديكور" : "Decor examples"}>
          {examples.map((example) => (
            <article className={styles.card} key={example.image}>
              <Image src={`/decor-fixtures/${example.image}.webp`} alt="" fill sizes="(max-width: 700px) 100vw, 33vw" />
              <div className={styles.cardOverlay}><h2>{example[locale]}</h2></div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
