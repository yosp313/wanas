import Link from "next/link";
import Image from "next/image";
import styles from "./homepage.module.css";
import type { Locale } from "@/lib/catalog/catalog";

export function Homepage({ locale, showNav = true }: { locale: Locale; showNav?: boolean }) {
  const ar = locale === "ar";
  return <main className={styles.home} dir={ar ? "rtl" : "ltr"}>
    {showNav && <nav className={styles.nav}><span className={styles.logo}>WANAS <small>ونس</small></span><Link href={`/${locale === "ar" ? "en" : "ar"}`}>{ar ? "English" : "العربية"}</Link></nav>}
    <section className={styles.hero}><p className={styles.kicker}>{ar ? "احتفالات مصممة بعناية في القاهرة" : "Thoughtful celebrations in Cairo"}</p><h1>{ar ? "لحظات تشبهكم" : "A celebration that feels like you"}</h1><p>{ar ? "ننسّق الديكور والضيافة ليصبح يومكم ذكرى جميلة." : "We shape decor and optional catering around the way you want to gather."}</p><Link className={styles.cta} href={`/${locale}/plan`}>{ar ? "خططوا حفلكم" : "Plan your event"}</Link></section>
    <section className={styles.gallery} aria-label={ar ? "أمثلة من الديكور" : "Decor examples"}><div className={styles.card}><Image src="/stitch-exports/event-scope-venue-estimator.png" alt={ar ? "تنسيق دافئ" : "Warm event styling"} fill sizes="(max-width: 700px) 100vw, 33vw" /><div className={styles.cardOverlay}><h2>{ar ? "دفء التيراكوتا" : "Sunlit terracotta"}</h2></div></div><div className={`${styles.card} ${styles.cardAlt}`}><Image src="/stitch-exports/moodboards-theme-selection.jpg" alt={ar ? "لوحة ألوان هادئة" : "A quiet moodboard"} fill sizes="(max-width: 700px) 100vw, 33vw" /><div className={styles.cardOverlay}><h2>{ar ? "حديقة هادئة" : "A quiet garden"}</h2></div></div><div className={`${styles.card} ${styles.cardDark}`}><Image src="/stitch-exports/event-scope-catering-estimator.png" alt={ar ? "تنسيق عشاء" : "Candlelit dinner styling"} fill sizes="(max-width: 700px) 100vw, 33vw" /><div className={styles.cardOverlay}><h2>{ar ? "ضوء الشموع" : "Candlelight"}</h2></div></div></section>
  </main>;
}
