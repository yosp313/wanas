import Image from "next/image";
import Link from "next/link";
import { type Locale } from "@/lib/catalog/catalog";
import styles from "./homepage.module.css";

const examples = [
  { image: "terracotta", en: "Sunlit terracotta", ar: "دفء التيراكوتا" },
  { image: "greenhouse", en: "A quiet garden", ar: "حديقة هادئة" },
  { image: "emerald", en: "Dinner at dusk", ar: "عشاء عند الغروب" },
];

export function Homepage({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const planner = `/${locale}/plan`;

  return (
    <main className={styles.home}>
      <section className={styles.hero}>
        <div>
          <h1>{ar ? "ديكور مناسبات في القاهرة" : "Event decor in Cairo"}</h1>
          <p className={styles.lede}>
            {ar
              ? "اختاروا ألوان الحفل وتفاصيله، وأضيفوا الضيافة حسب رغبتكم."
              : "Choose your decor, add catering if you need it, and request a quote from Wanas."}
          </p>
          <Link className={`button ${styles.cta}`} href={planner}>
            {ar ? "ابدأوا التخطيط" : "Plan your event"}
            <span aria-hidden="true">→</span>
          </Link>
        </div>
        <figure className={styles.heroPhoto}>
          <div className={styles.photo}>
            <Image
              src="/atelier/kosha.webp"
              alt={ar ? "كوشة بأقمشة رملية وأغصان خضراء" : "Ceremony backdrop with sandy linens and foliage"}
              fill
              preload
              sizes="(max-width: 760px) 92vw, 52vw"
            />
          </div>
          <figcaption>{ar ? "إلهام لتنسيق الكوشة" : "Ceremony backdrop inspiration"}</figcaption>
        </figure>
      </section>
      <section className={styles.gallery} aria-labelledby="home-inspiration">
        <h2 id="home-inspiration">{ar ? "إلهام للديكور" : "Decor inspiration"}</h2>
        {examples.map((example) => (
          <figure className={styles.card} key={example.image}>
            <div className={styles.cardImage}>
              <Image src={`/atelier/${example.image}.webp`} alt="" fill sizes="(max-width: 760px) 92vw, 30vw" />
            </div>
            <figcaption>{example[locale]}</figcaption>
          </figure>
        ))}
      </section>
      <section className={styles.process} aria-labelledby="home-process">
        <h2 id="home-process">{ar ? "كيف تخططون لمناسبتكم؟" : "How to plan your event"}</h2>
        <div className={styles.processGrid}>
          <article>
            <h3>{ar ? "تفاصيل المناسبة" : "Share the event details"}</h3>
            <p>{ar ? "أخبرونا بنوع المناسبة والمكان وعدد الضيوف." : "Tell us the occasion, venue, and expected guest count."}</p>
          </article>
          <article>
            <h3>{ar ? "الديكور والضيافة" : "Choose decor and catering"}</h3>
            <p>{ar ? "اختاروا الألوان والعناصر التي تفضلونها، أو اتركوا تنسيق الديكور لفريق وناس." : "Pick a palette and decor details, or ask Wanas to put them together. Catering is optional."}</p>
          </article>
          <article>
            <h3>{ar ? "عرض السعر" : "Receive a quote"}</h3>
            <p>{ar ? "يراجع فريق وناس طلبكم ويرسل لكم عرض سعر." : "Wanas reviews your request and sends you a quote."}</p>
          </article>
        </div>
        <Link className={styles.textLink} href={planner}>
          {ar ? "ابدأوا طلبكم" : "Start your request"}
          <span aria-hidden="true">→</span>
        </Link>
      </section>
    </main>
  );
}
