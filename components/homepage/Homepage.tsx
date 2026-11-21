import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { LuArrowRight, LuArrowUpRight } from "react-icons/lu";
import LocaleSwitcher from "@/app/[locale]/locale-switcher";
import { WanasWordmark } from "@/components/WanasWordmark";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";
import { ceremonies, dining, highlights, principles, studioSteps, venues } from "./content";
import styles from "./homepage.module.css";

export async function Homepage({ locale }: { locale: Locale }) {
  const ar = locale === "ar";
  const t = ([en, arabic]: readonly [string, string]) => ar ? arabic : en;
  const home = `/${locale}`;
  const planner = `${home}/plan`;
  const requests = `${home}/requests`;
  const dictionary = await getDictionary(locale);
  const nav = [
    { href: home, label: t(["Atelier", "الأتيليه"]) },
    { href: "#ceremonies", label: t(["Ceremonies & portfolio", "المراسم والأعمال"]) },
    { href: "#venues", label: t(["Atmospheres & venues", "الأجواء والأماكن"]) },
    { href: "#hospitality", label: t(["Culinary & hospitality", "الطعام والضيافة"]) },
    { href: "#studio", label: t(["Planning studio", "استوديو التخطيط"]) },
    { href: "#concierge", label: t(["Concierge", "استفسارات"]) },
  ];

  return (
    <div className={styles.site}>
      <header className={styles.header}>
        <div className={`${styles.wrap} ${styles.headerInner}`}>
          <WanasWordmark locale={locale} />
          <nav className={styles.headerActions} aria-label={t(["Main navigation", "التنقل الرئيسي"])}>
            <a href="#ceremonies">{t(["Portfolio", "أعمالنا"])}</a>
            <Link href={requests}>{dictionary.myRequests}</Link>
            <Link className={styles.primary} href={planner} data-press>{t(["Plan an event", "خطّطوا لمناسبتكم"])}</Link>
            <Suspense>
              <LocaleSwitcher locale={locale} label={dictionary.switchLanguage} />
            </Suspense>
            <UserButton />
          </nav>
        </div>
      </header>

      <main>
        <section className={`${styles.hero} ${styles.wrap}`}>
          <div className={styles.intro}>
            <span className={`${styles.eyebrow} ${styles.heroLabel}`}>{t(["Atelier scenography & celebration design", "أتيليه لتصميم وتنسيق المناسبات"])}</span>
            <h1>{t(["Poetic Spaces for", "مساحات شاعرية"])} <em>{t(["Singular Moments.", "للحظات لا تتكرّر."])}</em></h1>
            <p className={styles.lede}>{t([
              "Bespoke ceremony staging, venue styling, and hospitality for celebrations in Cairo. Plan the details and request a quote.",
              "تصميم الكوشة وتنسيق المكان والضيافة لمناسباتكم في القاهرة. خطّطوا للتفاصيل واطلبوا عرض سعر.",
            ])}</p>
            <div className={styles.actions}>
              <Link className={styles.primary} href={planner} data-press>{t(["Launch event planning studio", "افتحوا استوديو التخطيط"])} <LuArrowRight size={16} aria-hidden="true" /></Link>
              <a className={styles.secondary} href="#ceremonies" data-press>{t(["Explore ceremonial portfolio", "استكشفوا أعمالنا للمراسم"])} <LuArrowUpRight size={16} aria-hidden="true" /></a>
            </div>
          </div>
          <div className={styles.highlights}>
            {highlights.map((card) => (
              <article className={styles.overlay} key={card.image}>
                <Image
                  src={`/atelier/home/${card.image}.webp`}
                  alt=""
                  fill
                  preload={card.image === "kosha"}
                  sizes={`(max-width: 700px) 94vw, ${card.image === "kosha" ? "38vw" : "30vw"}`}
                />
                <div className={styles.overlayCopy}>
                  <span className={styles.eyebrow}>{t(card.kicker)}</span>
                  <h2>{t(card.title)}</h2>
                  <p>{t(card.description)}</p>
                </div>
              </article>
            ))}
          </div>
          <ul className={styles.facts}>
            {[
              [t(["Bespoke", "حسب الطلب"]), t(["Ceremony decor", "ديكور المراسم"])],
              [t(["Optional", "اختيارية"]), t(["Event catering", "ضيافة المناسبات"])],
              [t(["4 steps", "٤ خطوات"]), t(["Planning studio", "استوديو التخطيط"])],
              [t(["Cairo", "القاهرة"]), t(["Egypt", "مصر"])],
            ].map(([value, label]) => <li key={label}><strong>{value}</strong>{label}</li>)}
          </ul>
        </section>

        <section id="studio" className={`${styles.band} ${styles.softBand}`}>
          <div className={styles.wrap}>
            <div className={styles.split}>
              <div>
                <span className={styles.eyebrow}>{t(["Self-guided planning", "التخطيط الذاتي"])}</span>
                <h2>{t(["The WANAS Interactive Planning Studio", "استوديو وناس التفاعلي للتخطيط"])}</h2>
              </div>
              <p>{t(["Choose your palette, decor, and optional catering in four steps, then send your plan to WANAS for a quote.", "اختاروا الديكور وأضيفوا الضيافة إذا رغبتم. أرسلوا خطّتكم إلى وناس لطلب عرض سعر."])}</p>
            </div>
            <div className={styles.studioPanel}>
              <ol className={styles.four}>
                {studioSteps.map((step, index) => (
                  <li className={styles.step} key={step.title[0]}>
                    <span className={styles.stepNumber}>{t(["Step", "الخطوة"])} {(index + 1).toLocaleString(ar ? "ar-EG" : "en", { minimumIntegerDigits: 2 })}</span>
                    <h3>{t(step.title)}</h3>
                    <span className={styles.example}>{t(step.example)}</span>
                    <p>{t(step.description)}</p>
                  </li>
                ))}
              </ol>
              <div className={styles.studioAction}>
                <div>
                  <strong>{t(["Your event brief", "ملخّص مناسبتكم"])}</strong>
                  <p>{t(["Review your plans before requesting a quote.", "راجعوا خطّتكم قبل طلب عرض السعر."])}</p>
                </div>
                <Link className={styles.primary} href={planner} data-press>{t(["Start planning", "ابدأوا التخطيط لمناسبتكم"])} <LuArrowRight size={16} aria-hidden="true" /></Link>
              </div>
            </div>
          </div>
        </section>

        <section id="ceremonies" className={`${styles.band} ${styles.wrap}`}>
          <div className={styles.sectionTitle}>
            <span className={styles.eyebrow}>{t(["Atelier portfolio", "أعمال الأتيليه"])}</span>
            <h2>{t(["Crafted for Sacred & Joyous Rites", "تصميم يليق بمراسمكم واحتفالاتكم"])}</h2>
            <p>{t(["Explore settings for weddings, katb al-kitab, anniversaries, and private dinners.", "استكشفوا تنسيقات للزفاف وكتب الكتاب والاحتفال بالذكرى والعشاء الخاص."])}</p>
          </div>
          <div className={styles.four}>
            {ceremonies.map((card) => (
              <article className={styles.card} key={card.image}>
                <div className={styles.photo}>
                  <Image src={`/atelier/home/${card.image}.webp`} alt="" fill sizes="(max-width: 520px) 92vw, (max-width: 960px) 46vw, 310px" />
                </div>
                <div className={styles.cardBody}>
                  <span className={styles.eyebrow}>{t(card.kicker)}</span>
                  <h3>{t(card.title)}</h3>
                  <p>{t(card.description)}</p>
                  <Link className={styles.cardLink} href={`${planner}?eventType=${card.eventType}`}>
                    {t(["Plan this celebration", "خطّطوا لهذه المناسبة"])} <LuArrowRight size={16} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="venues" className={`${styles.band} ${styles.warmBand}`}>
          <div className={styles.wrap}>
            <div className={styles.split}>
              <div>
                <span className={styles.eyebrow}>{t(["Scenographic settings", "أماكن الاحتفال"])}</span>
                <h2>{t(["Spatial Settings That Resonate", "مساحات تنبض بأجوائكم"])}</h2>
              </div>
              <p>{t(["Explore how lighting, fabrics, and florals can shape the venue you choose.", "استكشفوا كيف تغيّر الإضاءة والأقمشة والزهور أجواء المكان الذي تختارونه."])}</p>
            </div>
            <div className={styles.four}>
              {venues.map((card) => (
                <article className={`${styles.overlay} ${styles.venue}`} key={card.image}>
                  <Image src={`/atelier/home/${card.image}.webp`} alt="" fill sizes="(max-width: 520px) 92vw, (max-width: 960px) 46vw, 25vw" />
                  <div className={styles.overlayCopy}>
                    <span className={styles.eyebrow}>{t(card.kicker)}</span>
                    <h3>{t(card.title)}</h3>
                    <p>{t(card.description)}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="hospitality" className={`${styles.band} ${styles.wrap}`}>
          <div className={styles.sectionTitle}>
            <span className={styles.eyebrow}>{t(["Artisanal dining", "فن الضيافة"])}</span>
            <h2>{t(["Gastronomy as Scenography", "الضيافة جزء من المشهد"])}</h2>
            <p>{t(["Choose tray service, a buffet with live cooking, or a plated dinner.", "اختاروا مقبلات تُقدّم على صوانٍ، أو بوفيه مع طهي مباشر، أو عشاءً بأطباق فردية."])}</p>
          </div>
          <div className={styles.three}>
            {dining.map((card) => (
              <article className={styles.card} key={card.image}>
                <div className={styles.photo}>
                  <Image src={`/atelier/home/${card.image}.webp`} alt="" fill sizes="(max-width: 760px) 92vw, 410px" />
                </div>
                <div className={styles.cardBody}>
                  <span className={styles.eyebrow}>{t(card.kicker)}</span>
                  <h3>{t(card.title)}</h3>
                  <p>{t(card.description)}</p>
                  <ul className={styles.tags}>
                    {card.tags.map((tag) => <li key={tag[0]} className={styles.example}>{t(tag)}</li>)}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className={`${styles.band} ${styles.softBand}`}>
          <div className={styles.wrap}>
            <div className={styles.sectionTitle}>
              <span className={styles.eyebrow}>{t(["The atelier approach", "نهج الأتيليه"])}</span>
              <h2>{t(["Disciplined Scenography", "تصميم مدروس لكل مناسبة"])}</h2>
            </div>
            <div className={styles.three}>
              {principles.map((principle) => (
                <article className={styles.principle} key={principle.title[0]}>
                  <h3>{t(principle.title)}</h3>
                  <p>{t(principle.description)}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="start" className={`${styles.band} ${styles.wrap}`}>
          <div className={styles.finalPanel}>
            <div className={styles.sectionTitle}>
              <span className={styles.eyebrow}>{t(["Your celebration", "مناسبتكم"])}</span>
              <h2>{t(["Begin Curating Your Celebration", "ابدأوا تنسيق مناسبتكم"])}</h2>
            </div>
            <form action={planner}>
              <fieldset>
                <legend>{t(["Select an occasion to open the planner", "اختاروا المناسبة لفتح استوديو التخطيط"])}</legend>
                <div className={styles.categories}>
                  {ceremonies.map((card, index) => (
                    <label key={card.eventType}>
                      <input type="radio" name="eventType" value={card.eventType} defaultChecked={index === 0} />
                      <span>{t(card.label)}</span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className={styles.actions}>
                <button className={styles.primary} type="submit">{t(["Open the planner", "افتحوا استوديو التخطيط"])} <LuArrowRight size={16} aria-hidden="true" /></button>
                <a className={styles.textLink} href="#concierge">{t(["Event inquiries", "استفسارات المناسبات"])} <LuArrowRight size={16} aria-hidden="true" /></a>
              </div>
            </form>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.wrap}>
          <div className={styles.footerGrid}>
            <div>
              <WanasWordmark locale={locale} />
              <p>{t(["WANAS designs decor and optional catering for celebrations in Cairo.", "تنسّق وناس ديكور المناسبات والضيافة الاختيارية في القاهرة."])}</p>
            </div>
            <div>
              <h2>{t(["The atelier", "الأتيليه"])}</h2>
              <p>{t(["Cairo, Egypt", "القاهرة، مصر"])}</p>
            </div>
            <div>
              <h2>{t(["Explore", "استكشفوا"])}</h2>
              <nav aria-label={t(["WANAS links", "روابط وناس"])}>
                {nav.map(({ href, label }) => <Link key={href} href={href}>{label}</Link>)}
              </nav>
            </div>
            <div id="concierge">
              <h2>{t(["Event inquiries", "استفسارات المناسبات"])}</h2>
              <p>{t(["Tell us about your celebration and request a quote.", "أخبرونا بتفاصيل مناسبتكم واطلبوا عرض سعر."])}</p>
              <Link href={planner} className={styles.secondary} data-press>{t(["Start your request", "ابدأوا طلبكم"])}</Link>
            </div>
          </div>
          <div className={styles.footerEnd}>
            <p>© WANAS</p>
            <Link href={requests}>{dictionary.myRequests}</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
