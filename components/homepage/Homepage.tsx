import { Suspense } from "react";
import Image from "next/image";
import Link from "next/link";
import AccountControl from "@/app/[locale]/account-control";
import LocaleSwitcher from "@/app/[locale]/locale-switcher";
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
    { href: "#ceremonies", label: t(["Ceremonies", "المراسم"]) },
    { href: "#venues", label: t(["Venues", "الأماكن"]) },
    { href: "#hospitality", label: t(["Hospitality", "الضيافة"]) },
    { href: "#studio", label: t(["Planning studio", "استوديو التخطيط"]) },
  ];

  const navigation = nav.map(({ href, label }) => href === home
    ? <Link key={href} href={href} aria-current="page">{label}</Link>
    : <a key={href} href={href}>{label}</a>);

  function brand() {
    return (
      <Link className={styles.brand} href={home}>
        <span dir="ltr">WANAS <bdi lang="ar">وَنَس</bdi></span>
        <small>{t(["Celebration design", "تنسيق المناسبات"])}</small>
      </Link>
    );
  }

  return (
    <div className={styles.site}>
      <header className={styles.header}>
        <div className={`${styles.wrap} ${styles.headerInner}`}>
          {brand()}
          <nav className={styles.mainNav} aria-label={t(["Main navigation", "التنقل الرئيسي"])}>
            {navigation}
          </nav>
          <details className={styles.menu}>
            <summary>{t(["Menu", "القائمة"])}</summary>
            <nav aria-label={t(["Main navigation", "التنقل الرئيسي"])}>{navigation}</nav>
          </details>
          <div className={styles.headerActions}>
            <Link href={requests}>{dictionary.myRequests}</Link>
            <Link className={styles.primary} href={planner}>{t(["Plan an event", "خطّطوا لمناسبتكم"])}</Link>
            <Suspense>
              <LocaleSwitcher locale={locale} label={dictionary.switchLanguage} />
            </Suspense>
            <AccountControl locale={locale} />
          </div>
        </div>
      </header>

      <main>
        <section className={`${styles.hero} ${styles.wrap}`}>
          <div className={styles.heroLead}>
            <div className={styles.intro}>
              <h1>{t(["Celebration design in Cairo", "تصميم وتنسيق المناسبات في القاهرة"])}</h1>
              <p className={styles.lede}>{t([
                "Kosha and ceremony decor, venue styling, and optional catering. Put together your event plan and send it to WANAS for a quote.",
                "نصمّم الكوشة وننسّق ديكور المكان، مع إمكانية إضافة الضيافة. جهّزوا خطّتكم وأرسلوها إلى وناس لطلب عرض سعر.",
              ])}</p>
              <div className={styles.actions}>
                <Link className={styles.primary} href={planner}>{t(["Plan an event", "خطّطوا لمناسبتكم"])} <span aria-hidden="true">→</span></Link>
                <a className={styles.textLink} href="#ceremonies">{t(["Explore ceremony decor", "استكشفوا ديكور المراسم"])} <span aria-hidden="true">→</span></a>
              </div>
            </div>
            <figure className={styles.heroFigure}>
              <div className={styles.heroPhoto}>
                <Image src="/atelier/home/kosha.webp" alt={t(["A wedding kosha under three arches, with a low sofa and floral arrangements", "كوشة زفاف تحت ثلاثة أقواس، فيها أريكة منخفضة وتنسيقات زهور"])} fill preload sizes="(max-width: 760px) 100vw, (max-width: 1360px) 56vw, 744px" />
              </div>
              <figcaption>
                <strong>{t(["Kosha and ceremony staging", "الكوشة وتنسيق المراسم"])}</strong>
                <span>{t(["Stone arches, draped fabric, and flowers", "أقواس حجرية وأقمشة منسدلة وزهور"])}</span>
              </figcaption>
            </figure>
          </div>
          <div className={styles.highlights}>
            {highlights.map((card) => (
              <article key={card.image}>
                <div className={styles.photo}>
                  <Image src={`/atelier/home/${card.image}.webp`} alt="" fill sizes="(max-width: 520px) 112px, 160px" />
                </div>
                <div>
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
              <h2>{t(["Plan your event in four steps", "خطّطوا لمناسبتكم في أربع خطوات"])}</h2>
              <p>{t(["Choose your decor and add catering if you need it. Send your plan to WANAS for a quote.", "اختاروا الديكور وأضيفوا الضيافة إذا رغبتم. أرسلوا خطّتكم إلى وناس لطلب عرض سعر."])}</p>
            </div>
            <div className={styles.studioPanel}>
              <ol className={styles.four}>
                {studioSteps.map((step, index) => (
                  <li className={styles.step} key={step.title[0]}>
                    <span className={styles.stepNumber}>{(index + 1).toLocaleString(ar ? "ar-EG" : "en")}</span>
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
                <Link className={styles.primary} href={planner}>{t(["Start planning", "ابدأوا التخطيط لمناسبتكم"])} <span aria-hidden="true">→</span></Link>
              </div>
            </div>
          </div>
        </section>

        <section id="ceremonies" className={`${styles.band} ${styles.wrap}`}>
          <div className={styles.sectionTitle}>
            <h2>{t(["Decor by occasion", "ديكور لكل مناسبة"])}</h2>
            <p>{t(["Explore settings for weddings, katb al-kitab, anniversaries, and private dinners.", "استكشفوا تنسيقات للزفاف وكتب الكتاب والاحتفال بالذكرى والعشاء الخاص."])}</p>
          </div>
          <div className={styles.four}>
            {ceremonies.map((card) => (
              <article className={styles.card} key={card.image}>
                <div className={styles.photo}>
                  <Image src={`/atelier/home/${card.image}.webp`} alt="" fill sizes="(max-width: 520px) 92vw, (max-width: 960px) 46vw, 310px" />
                </div>
                <div className={styles.cardBody}>
                  <h3>{t(card.title)}</h3>
                  <p>{t(card.description)}</p>
                  <Link className={styles.cardLink} href={`${planner}?eventType=${card.eventType}`}>
                    {t(["Plan this celebration", "خطّطوا لهذه المناسبة"])} <span aria-hidden="true">→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="venues" className={`${styles.band} ${styles.softBand}`}>
          <div className={styles.wrap}>
            <div className={styles.split}>
              <h2>{t(["Decor for your venue", "ديكور يناسب مكان مناسبتكم"])}</h2>
              <p>{t(["Explore how lighting, fabrics, and florals can shape the venue you choose.", "استكشفوا كيف تغيّر الإضاءة والأقمشة والزهور أجواء المكان الذي تختارونه."])}</p>
            </div>
            <div className={styles.four}>
              {venues.map((card) => (
                <article className={styles.card} key={card.image}>
                  <div className={styles.photo}>
                    <Image src={`/atelier/home/${card.image}.webp`} alt="" fill sizes="(max-width: 520px) 92vw, (max-width: 960px) 46vw, 310px" />
                  </div>
                  <div className={styles.cardBody}>
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
            <h2>{t(["Catering and service", "الضيافة وتقديم الطعام"])}</h2>
            <p>{t(["Choose tray service, a buffet with live cooking, or a plated dinner.", "اختاروا مقبلات تُقدّم على صوانٍ، أو بوفيه مع طهي مباشر، أو عشاءً بأطباق فردية."])}</p>
          </div>
          <div className={styles.three}>
            {dining.map((card) => (
              <article className={styles.card} key={card.image}>
                <div className={styles.photo}>
                  <Image src={`/atelier/home/${card.image}.webp`} alt="" fill sizes="(max-width: 760px) 92vw, 410px" />
                </div>
                <div className={styles.cardBody}>
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
              <h2>{t(["How we design your event", "كيف نصمّم مناسبتكم"])}</h2>
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
              <h2>{t(["Choose your occasion", "اختاروا نوع المناسبة"])}</h2>
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
              <button className={styles.primary} type="submit">{t(["Open the planner", "افتحوا استوديو التخطيط"])} <span aria-hidden="true">→</span></button>
            </form>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.wrap}>
          <div className={styles.footerGrid}>
            <div>
              {brand()}
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
            <div>
              <h2>{t(["Event inquiries", "استفسارات المناسبات"])}</h2>
              <p>{t(["Tell us about your celebration and request a quote.", "أخبرونا بتفاصيل مناسبتكم واطلبوا عرض سعر."])}</p>
              <Link href={planner} className={styles.secondary}>{t(["Start your request", "ابدأوا طلبكم"])}</Link>
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
