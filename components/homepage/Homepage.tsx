import Image from "next/image";
import Link from "next/link";
import { LuArrowRight, LuArrowUpRight } from "react-icons/lu";
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
    { href: home, label: t(["Home", "الرئيسية"]) },
    { href: "#ceremonies", label: t(["Our work", "أعمالنا"]) },
    { href: "#venues", label: t(["Venues", "أماكن المناسبات"]) },
    { href: "#hospitality", label: t(["Catering", "الضيافة"]) },
    { href: "#studio", label: t(["Event planner", "مخطط المناسبات"]) },
    { href: "#concierge", label: t(["Event inquiries", "استفسارات المناسبات"]) },
  ];

  return (
    <div className={styles.site}>
      <main>
        <section className={`${styles.hero} ${styles.wrap}`}>
          <div className={styles.intro}>
            <h1>{t(["Event decor", "ديكور المناسبات"])} <em>{t(["in Cairo", "في القاهرة"])}</em></h1>
            <p className={styles.lede}>{t([
              "WANAS designs the kosha, decorates your venue, and offers catering. Tell us about your event to get a quote.",
              "تصمّم وناس الكوشة وتنسّق المكان وتوفّر الضيافة عند الطلب. شاركونا تفاصيل مناسبتكم لنرسل لكم عرض سعر.",
            ])}</p>
            <div className={styles.actions}>
              <Link className={styles.primary} href={planner} data-press>{t(["Start planning", "ابدؤوا التخطيط"])} <LuArrowRight size={16} aria-hidden="true" /></Link>
              <a className={styles.secondary} href="#ceremonies" data-press>{t(["See our work", "شاهدوا أعمالنا"])} <LuArrowUpRight size={16} aria-hidden="true" /></a>
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
              [t(["Custom", "حسب الطلب"]), t(["Ceremony decor", "ديكور المراسم"])],
              [t(["Optional", "اختيارية"]), t(["Event catering", "ضيافة المناسبات"])],
              [t(["4 steps", "٤ خطوات"]), t(["Event planner", "مخطط المناسبات"])],
              [t(["Cairo", "القاهرة"]), t(["Egypt", "مصر"])],
            ].map(([value, label]) => <li key={label}><strong>{value}</strong>{label}</li>)}
          </ul>
        </section>

        <section id="studio" className={`${styles.band} ${styles.softBand}`}>
          <div className={styles.wrap}>
            <div className={styles.split}>
              <div>
                <h2>{t(["How to request a quote", "كيف تطلبون عرض سعر"])}</h2>
              </div>
              <p>{t(["You can fill out the planner as a guest. Sign in when you're ready to send your request.", "يمكنكم استخدام المخطط دون حساب. سجّلوا الدخول عند إرسال الطلب."])}</p>
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
            <h2>{t(["Decor for weddings and private events", "ديكور الزفاف والمناسبات الخاصة"])}</h2>
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
                <h2>{t(["Decor for your venue", "ديكور يناسب مكان مناسبتكم"])}</h2>
              </div>
              <p>{t(["You choose the venue. We plan the lighting, drapery, and flowers for the space.", "اختاروا المكان، ونتولّى تنسيق الإضاءة والأقمشة والزهور بما يناسبه."])}</p>
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
            <h2>{t(["Catering options", "خيارات الضيافة"])}</h2>
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
              <h2>{t(["What WANAS plans", "ما يتولّى فريق وناس تنسيقه"])}</h2>
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
              <h2>{t(["Plan your event", "خطّطوا لمناسبتكم"])}</h2>
            </div>
            <form action={planner}>
              <fieldset>
                <legend>{t(["Choose an event type", "اختاروا نوع المناسبة"])}</legend>
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
                <button className={styles.primary} type="submit">{t(["Open the planner", "افتحوا مخطط المناسبات"])} <LuArrowRight size={16} aria-hidden="true" /></button>
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
              <h2>{t(["Location", "الموقع"])}</h2>
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
