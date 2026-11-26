import Image from "next/image";
import Link from "next/link";
import { LuArrowRight, LuArrowUpRight } from "react-icons/lu";
import { catalog } from "@/lib/catalog/catalog";
import type { Locale } from "@/lib/i18n/config";
import { ceremonies, dining, studioSteps, venues } from "./content";
import { SettingGallery } from "./SettingGallery";
import styles from "./homepage.module.css";

type Copy = readonly [string, string];

export function Homepage({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const t = ([en, arabic]: Copy) => ar ? arabic : en;
  const planner = `/${locale}/plan`;

  return (
    <main className={styles.site}>
      <section className={styles.hero} id="start">
        <div className={styles.intro}>
          <h1>{t(["Event decor\nin Cairo", "ديكور المناسبات\nفي القاهرة"])}</h1>
          <p>{t([
            "From the kosha to the tables, we style your venue and arrange catering if you need it.",
            "من الكوشة إلى موائد الضيوف، ننسّق ديكور مكانكم ونوفّر الضيافة عند الطلب.",
          ])}</p>
          <form action={planner} className={styles.startForm}>
            <label htmlFor="occasion">{t(["Your occasion", "مناسبتكم"])}</label>
            <div className={styles.formControls}>
              <select id="occasion" name="eventType" defaultValue="" required>
                <option value="" disabled>{t(["Choose an occasion", "اختاروا نوع المناسبة"])}</option>
                {catalog.eventTypes.map(({ id, labels }) => <option key={id} value={id}>{labels[locale]}</option>)}
              </select>
              <button className={styles.primary} type="submit">{t(["Open the planner", "افتحوا المخطط"])} <LuArrowRight aria-hidden="true" /></button>
            </div>
            <small>{t(["Sign in when you’re ready to send your request.", "سجّلوا الدخول عند إرسال الطلب."])}</small>
          </form>
        </div>
        <SettingGallery locale={locale} />
      </section>

      <div className={styles.wrap}>
        <nav className={styles.index} aria-label={t(["On this page", "في هذه الصفحة"])}>
          <a href="#ceremonies">{t(["Decor by occasion", "الديكور حسب المناسبة"])}</a>
          <a href="#venues">{t(["Venue ideas", "أفكار للمكان"])}</a>
          <a href="#hospitality">{t(["Catering", "الضيافة"])}</a>
          <a href="#studio">{t(["How planning works", "طريقة التخطيط"])}</a>
        </nav>

        <section id="ceremonies" className={styles.band}>
          <header className={styles.sectionHead}>
            <h2>{t(["Find your occasion", "اختاروا مناسبتكم"])}</h2>
            <p>{t(["Browse decor ideas and start with the occasion you’re planning.", "تصفّحوا أفكار الديكور وابدؤوا التخطيط لمناسبتكم."])}</p>
          </header>
          <ul className={styles.occasions}>
            {ceremonies.map((card) => (
              <li key={card.eventType}>
                <Link href={`${planner}?eventType=${card.eventType}`} className={styles.occasion}>
                  <span className={styles.photo}><Image className="image-edge" src={`/atelier/home/${card.image}.webp`} alt="" fill sizes="(max-width: 640px) 88vw, 45vw" /></span>
                  <div className={styles.occasionCopy}>
                    <h3>{t(card.title)}</h3>
                    <p>{t(card.description)}</p>
                    <LuArrowUpRight size={23} aria-hidden="true" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section id="venues" className={`${styles.band} ${styles.venues}`}>
        <div className={styles.wrap}>
          <header className={styles.sectionHead}>
            <h2>{t(["Your venue, styled", "ديكور يناسب مكانكم"])}</h2>
            <p>{t(["You choose the venue. We plan the lighting, drapery, and flowers for the space.", "اختاروا المكان، ونتولّى تنسيق الإضاءة والأقمشة والزهور بما يناسبه."])}</p>
          </header>
          <ul className={styles.venueList}>
            {venues.map((card) => (
              <li key={card.image}>
                <div className={styles.photo}><Image className="image-edge" src={`/atelier/home/${card.image}.webp`} alt="" fill sizes="(max-width: 900px) 44vw, 23vw" /></div>
                <h3>{t(card.title)}</h3>
                <p>{t(card.description)}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section id="hospitality" className={`${styles.band} ${styles.wrap}`}>
        <header className={styles.sectionHead}>
          <h2>{t(["At the table", "على المائدة"])}</h2>
          <p>{t(["Add catering to your brief if you’d like WANAS to handle the food as well.", "أضيفوا الضيافة إلى طلبكم إذا أردتم أن يتولّى فريق وناس تقديم الطعام."])}</p>
        </header>
        <ul className={styles.dining}>
          {dining.map((card) => (
            <li key={card.image}>
              <div className={styles.photo}><Image className="image-edge" src={`/atelier/home/${card.image}.webp`} alt="" fill sizes="(max-width: 640px) 88vw, 31vw" /></div>
              <h3>{t(card.title)}</h3>
              <p>{t(card.description)}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.process} id="studio">
        <div className={styles.wrap}>
          <div className={styles.processInfo} id="concierge">
            <h2>{t(["How to request a quote", "كيف تطلبون عرض سعر"])}</h2>
            <p>{t(["Build your brief, then send it to WANAS for a quote in Egyptian pounds.", "جهّزوا تفاصيل مناسبتكم، ثم أرسلوها إلى وناس لعرض سعر بالجنيه المصري."])}</p>
            <Link href={planner} className={styles.primary}>{t(["Start planning", "ابدؤوا التخطيط"])} <LuArrowRight aria-hidden="true" /></Link>
          </div>
          <ol>
            {studioSteps.map((step) => (
              <li key={step.title[0]}>
                <h3>{t(step.title)}</h3>
                <p>{t(step.description)}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
