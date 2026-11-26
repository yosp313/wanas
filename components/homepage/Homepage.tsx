import Image from "next/image";
import Link from "next/link";
import { LuArrowRight, LuArrowUpRight } from "react-icons/lu";
import { catalog } from "@/lib/catalog/catalog";
import type { Locale } from "@/lib/i18n/config";
import { ceremonies, dining, settings, studioSteps, venues } from "./content";
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
          <h1 lang="en" dir="ltr">{"Your Vision.\nOur People.\nYour Celebration."}</h1>
          <p lang="ar" dir="rtl">تَفَاصِيل يَوْمَك.. بِلَمْسَة مِنْ نَاسْنَا</p>
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
        <SettingGallery locale={locale} slides={settings} label={t(["Event settings", "مشاهد المناسبات"])} hero />
      </section>

      <div className={styles.wrap}>
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

      <section id="venues" aria-labelledby="venues-heading">
        <SettingGallery locale={locale} slides={venues} label={t(["Venue ideas", "أفكار للمكان"])}>
          <header className={styles.venueIntro}>
            <h2 id="venues-heading">{t(["Your venue, styled", "ديكور يناسب مكانكم"])}</h2>
            <p>{t(["You choose the venue. We plan the lighting, drapery, and flowers for the space.", "اختاروا المكان، ونتولّى تنسيق الإضاءة والأقمشة والزهور بما يناسبه."])}</p>
          </header>
        </SettingGallery>
      </section>

      <section id="hospitality" className={`${styles.band} ${styles.wrap}`}>
        <header className={styles.sectionHead}>
          <h2>{t(["At the table", "على المائدة"])}</h2>
          <p>{t(["Add catering to your brief if you’d like WANAS to handle the food as well.", "أضيفوا الضيافة إلى طلبكم إذا أردتم أن يتولّى فريق وناس تقديم الطعام."])}</p>
        </header>
        <ul className={styles.dining}>
          {dining.map(({ icon: Icon, title, description }) => (
            <li key={title[0]}>
              <div className={styles.diningIcon}><Icon aria-hidden="true" /></div>
              <div className={styles.diningCopy}>
                <h3>{t(title)}</h3>
                <p>{t(description)}</p>
              </div>
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
