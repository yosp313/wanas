"use client";
import { useEffect, useMemo, useRef, useState, type FocusEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { FieldError } from "@/components/forms/field-validation";
import { fieldsByStep, plannerFieldErrors, type PlannerField } from "./field-errors";
import Image from "next/image";
import { submitRequestAction } from "@/app/actions/submit-request";
import { MoodboardGallery } from "./MoodboardGallery";
import { catalog, catalogLabel, type Locale } from "@/lib/catalog/catalog";
import { emptyDraft, type PlannerDraft } from "@/lib/planner/types";
import styles from "./planner.module.css";

const venueImages: Record<string, string> = {
  villa: "courtyard",
  garden: "greenhouse",
  hall: "ballroom",
  hotel: "pavilion",
};

const venueOptions = [
  ...catalog.venueTypes.filter(({ id }) => venueImages[id]),
  ...catalog.venueTypes.filter(({ id }) => !venueImages[id]),
];

const cateringDetails: Record<string, Record<Locale, string>> = {
  canapes: {
    en: "Small bites for a standing reception",
    ar: "لقيمات خفيفة لاستقبال الضيوف",
  },
  buffet: {
    en: "Guests choose from a shared spread",
    ar: "تشكيلة أطباق يختار منها الضيوف",
  },
  plated: {
    en: "Individual courses served at the table",
    ar: "أطباق فردية تُقدّم على الطاولة",
  },
  recommend: {
    en: "We’ll suggest a format for your venue and guest count",
    ar: "نقترح أسلوبًا يناسب المكان وعدد الضيوف",
  },
};

const storageKey = "wanas-planner-draft-v1";
const copy = {
  en: {
    title: "Plan your event",
    intro:
      "Tell us what you are imagining. You can change any answer before you submit.",
    next: "Continue",
    back: "Back",
    submit: "Submit request",
    review: "Review your request",
    details: "Event details",
    design: "Decor direction",
    catering: "Optional catering",
    saved: "Your progress is saved in this tab.",
    eventType: "Event type",
    guests: "Estimated guests",
    date: "Event date",
    venue: "Venue name",
    address: "Street address",
    venueType: "Venue type",
    budget: "Budget for decor and catering",
    notes: "Notes",
    links: "Inspiration links",
    name: "Name",
    mobile: "Mobile number",
    includeCatering: "Include catering",
    delegated: "Leave an element unselected and WANAS will choose it for you.",
    choose: "WANAS chooses",
    booked: "Booked",
    held: "Held",
    unavailable: "This date is already booked.",
    failed: "We could not submit the request. Check the details and try again.",
    notRequested: "Not requested",
  },
  ar: {
    title: "خططوا حفلكم",
    intro: "يمكنكم تعديل أي إجابة قبل الإرسال.",
    next: "التالي",
    back: "رجوع",
    submit: "إرسال الطلب",
    review: "مراجعة الطلب",
    details: "تفاصيل الحفل",
    design: "اتجاه الديكور",
    catering: "ضيافة اختيارية",
    saved: "يُحفظ تقدمكم في هذه الصفحة.",
    eventType: "نوع المناسبة",
    guests: "عدد الضيوف المتوقع",
    date: "تاريخ المناسبة",
    venue: "اسم المكان",
    address: "العنوان بالتفصيل",
    venueType: "نوع المكان",
    budget: "ميزانية الديكور والضيافة",
    notes: "ملاحظات",
    links: "روابط للإلهام",
    name: "الاسم",
    mobile: "رقم الهاتف",
    includeCatering: "أرغب في الضيافة",
    delegated: "اتركوا العنصر دون اختيار ليقترح فريق وناس المناسب.",
    choose: "يختار فريق وناس",
    booked: "محجوز",
    held: "معلّق",
    unavailable: "هذا التاريخ محجوز بالفعل.",
    failed: "تعذر إرسال الطلب. تحققوا من البيانات وحاولوا مرة أخرى.",
    notRequested: "لا توجد ضيافة",
  },
} as const;

function Options({
  group,
  value,
  onChange,
  locale,
  allowDelegation = false,
}: {
  group: keyof typeof catalog;
  value: string;
  onChange: (value: string) => void;
  locale: Locale;
  allowDelegation?: boolean;
}) {
  const t = copy[locale];
  return (
    <div className={styles.options}>
      {allowDelegation && (
        <button
          type="button"
          className={!value ? styles.selected : ""}
          aria-pressed={!value}
          onClick={() => onChange("")}
        >
          {t.choose}
        </button>
      )}
      {catalog[group].map((option) => (
        <button
          type="button"
          key={option.id}
          className={value === option.id ? styles.selected : ""}
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
        >
          {option.labels[locale]}
        </button>
      ))}
    </div>
  );
}
function monthDates(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const count = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return Array.from(
    { length: count },
    (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`,
  );
}
function cairoToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}
function minimumCairoDate() {
  const [year, month, day] = cairoToday().split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day + 10))
    .toISOString()
    .slice(0, 10);
}
function AvailabilityCalendar({
  month,
  selected,
  booked,
  held,
  minimum,
  onMonthChange,
  onSelect,
  locale,
}: {
  month: string;
  selected: string;
  booked: string[];
  held: string[];
  minimum: string;
  onMonthChange: (month: string) => void;
  onSelect: (date: string) => void;
  locale: Locale;
}) {
  const t = copy[locale];
  const monthStart = new Date(`${month}-01T00:00:00Z`);
  const monthLabel = new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
    numberingSystem: "latn",
  }).format(monthStart);
  const weekdays = new Intl.DateTimeFormat(locale, {
    weekday: "short",
    timeZone: "UTC",
  });
  const shift = (amount: number) => {
    const date = new Date(monthStart);
    date.setUTCMonth(date.getUTCMonth() + amount);
    onMonthChange(date.toISOString().slice(0, 7));
  };
  return (
    <div className={styles.calendar} aria-label={t.date}>
      <div className={styles.calendarHeader}>
        <button
          type="button"
          onClick={() => shift(-1)}
          aria-label={locale === "ar" ? "الشهر السابق" : "Previous month"}
        >
          ‹
        </button>
        <strong>{monthLabel}</strong>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label={locale === "ar" ? "الشهر التالي" : "Next month"}
        >
          ›
        </button>
      </div>
      <div className={styles.calendarLegend}>
        <span>
          <i className={styles.legendAvailable} />
          {locale === "ar" ? "متاح" : "Available"}
        </span>
        <span>
          <i className={styles.legendHeld} />
          {t.held}
        </span>
        <span>
          <i className={styles.legendBooked} />
          {t.booked}
        </span>
      </div>
      <div className={styles.calendarDays}>
        {Array.from({ length: 7 }, (_, index) =>
          weekdays.format(new Date(Date.UTC(2024, 0, 7 + index))),
        ).map((day) => (
          <span key={day}>{day}</span>
        ))}
        {Array.from({ length: monthStart.getUTCDay() }, (_, index) => (
          <span key={index} aria-hidden="true" />
        ))}
        {monthDates(month).map((date) => {
          const isBooked = booked.includes(date);
          const isPast = date < minimum;
          const isHeld = held.includes(date);
          return (
            <button
              type="button"
              key={date}
              disabled={isBooked || isPast}
              aria-pressed={selected === date}
              aria-label={`${t.date} ${date}${isBooked ? `, ${t.booked}` : isHeld ? `, ${t.held}` : ""}`}
              className={`${selected === date ? styles.dateSelected : ""} ${isHeld ? styles.dateHeld : ""}`}
              onClick={() => onSelect(date)}
            >
              {Number(date.slice(-2))}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Planner({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [draft, setDraft] = useState<PlannerDraft>(() => emptyDraft(locale));
  const [submissionId, setSubmissionId] = useState("");
  const [step, setStep] = useState(1);
  const [touched, setTouched] = useState<Partial<Record<PlannerField, boolean>>>({});
  const [dateError, setDateError] = useState("");
  const [bookedDates, setBookedDates] = useState<string[]>([]);
  const [heldDates, setHeldDates] = useState<string[]>([]);
  const [visibleMonth, setVisibleMonth] = useState("");
  const [minimumDate, setMinimumDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [availabilityError, setAvailabilityError] = useState(false);
  const router = useRouter();
  const heading = useRef<HTMLHeadingElement>(null);
  const focusTarget = useRef<true | PlannerField | null>(null);
  function focusField(field: PlannerField) {
    document.querySelector<HTMLElement>(`[aria-describedby="planner-error-${field}"]`)?.focus();
  }

  useEffect(() => {
    const target = focusTarget.current;
    focusTarget.current = null;
    if (target === true) heading.current?.focus();
    else if (target) focusField(target);
  }, [step]);

  function goToStep(target: number, field?: PlannerField) {
    if (target === step) {
      if (field) focusField(field);
      return;
    }
    focusTarget.current = field ?? true;
    setStep(target);
  }
  // sessionStorage is tab-scoped and only exists after hydration.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMinimumDate(minimumCairoDate());
    const eventType = new URLSearchParams(window.location.search).get("eventType");
    const initialDraft = emptyDraft(locale);
    if (eventType && catalog.eventTypes.some((option) => option.id === eventType)) {
      initialDraft.eventType = eventType;
    }
    setDraft(initialDraft);
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const saved = JSON.parse(raw);
        setDraft({ ...emptyDraft(locale), ...saved.draft, locale });
        setSubmissionId(saved.submissionId || crypto.randomUUID());
        setStep([1, 2, 3, 4].includes(saved.step) ? saved.step : 1);
        setVisibleMonth(saved.visibleMonth || minimumCairoDate().slice(0, 7));
      } else {
        setSubmissionId(crypto.randomUUID());
        setVisibleMonth(minimumCairoDate().slice(0, 7));
      }
    } catch {
      setSubmissionId(crypto.randomUUID());
      setVisibleMonth(minimumCairoDate().slice(0, 7));
    }
  }, [locale]);
  useEffect(() => {
    try {
      if (submissionId)
        sessionStorage.setItem(
          storageKey,
          JSON.stringify({ draft, submissionId, step, visibleMonth, locale }),
        );
    } catch {
      /* storage can be disabled */
    }
  }, [draft, locale, step, submissionId, visibleMonth]);
  useEffect(() => {
    if (!visibleMonth) return;
    const controller = new AbortController();
    fetch(`/api/availability?month=${visibleMonth}`, {
      cache: "no-store",
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("availability");
        return response.json();
      })
      .then((data: { dates?: Array<{ date: string; status: string }> }) => {
        setAvailabilityError(false);
        const dates = data.dates ?? [];
        setBookedDates(
          dates
            .filter((date) => date.status === "booked")
            .map((date) => date.date),
        );
        setHeldDates(
          dates
            .filter((date) => date.status === "held")
            .map((date) => date.date),
        );
      })
      .catch((error) => {
        if (error.name !== "AbortError") {
          setAvailabilityError(true);
          setBookedDates([]);
          setHeldDates([]);
        }
      });
    return () => controller.abort();
  }, [visibleMonth]);
  const update = <K extends keyof PlannerDraft>(
    field: K,
    value: PlannerDraft[K],
  ) => setDraft((current) => ({ ...current, [field]: value }));
  const submission = useMemo(() => ({
    ...draft,
    eventTypeOther: draft.eventType === "other" ? draft.eventTypeOther : "",
    venueTypeOther: draft.venueType === "other" ? draft.venueTypeOther : "",
  }), [draft]);
  const errors = useMemo(
    () => ({ ...plannerFieldErrors(submission, minimumDate, bookedDates), ...(dateError ? { eventDate: dateError } : {}) }),
    [bookedDates, dateError, minimumDate, submission],
  );

  function touch(field: PlannerField) {
    setTouched((current) => current[field] ? current : { ...current, [field]: true });
  }

  function fieldProps(field: PlannerField) {
    return {
      "aria-describedby": `planner-error-${field}`,
      "aria-invalid": touched[field] && errors[field] ? true : undefined,
      onBlur(event: FocusEvent<HTMLElement>) {
        if (!event.currentTarget.contains(event.relatedTarget)) touch(field);
      },
    };
  }

  function fieldError(field: PlannerField) {
    return <FieldError id={`planner-error-${field}`} message={touched[field] ? errors[field] : undefined} />;
  }

  function validateStep(target: number) {
    const fields = fieldsByStep[target - 1];
    const invalid = fields.find((field) => errors[field]);
    if (!invalid) return true;
    setTouched((current) => ({ ...current, ...Object.fromEntries(fields.map((field) => [field, true])) }));
    goToStep(target, invalid);
    return false;
  }

  const next = () => {
    if (validateStep(step)) goToStep(step + 1);
  };
  const submit = async () => {
    if (!submissionId || submitting) return;
    if (![1, 2, 4].every(validateStep)) return;
    setSubmitting(true);
    let response;
    try {
      response = await submitRequestAction(submission, submissionId);
    } catch {
      setSubmitting(false);
      toast.error(t.failed);
      return;
    }
    if (!response.ok) {
      setSubmitting(false);
      if (response.error === "AUTH_REQUIRED") {
        router.push(`/${locale}/sign-in?returnTo=/${locale}/plan?review=1`);
        return;
      }
      if (response.error === "DATE_UNAVAILABLE" || response.error === "DATE_NOTICE") {
        setDateError(response.error === "DATE_UNAVAILABLE"
          ? t.unavailable
          : locale === "ar" ? "اختاروا موعدًا بعد 10 أيام على الأقل." : "Choose a date at least 10 days away.");
        touch("eventDate");
        goToStep(1, "eventDate");
      } else {
        toast.error(t.failed);
      }
      return;
    }
    try {
      sessionStorage.removeItem(storageKey);
    } catch {
      /* storage can be disabled */
    }
    toast.success(locale === "ar" ? "تم إرسال الطلب." : "Request sent.");
    router.push(`/${locale}/requests/${response.result.requestId}`);
  };
  const eventLabel = draft.eventType
    ? catalogLabel("eventTypes", draft.eventType, locale)
    : "-";
  const steps =
    locale === "ar"
      ? ["التفاصيل", "الديكور", "الضيافة", "المراجعة"]
      : ["Details", "Decor", "Catering", "Review"];
  const title =
    locale === "ar"
      ? [
          "تفاصيل المناسبة",
          "اختاروا الديكور",
          "اختاروا أسلوب الضيافة",
          "راجعوا تفاصيل الحفل",
        ]
      : [
          "Plan your event",
          "Choose your decor",
          "Choose your catering",
          "Review your request",
        ];
  const captions =
    locale === "ar"
      ? [
          "اختاروا ما يناسب مناسبتكم ومكانها.",
          "اتركوا لنا ملامح رؤيتكم لننسّق التفاصيل.",
          "ضيافة اختيارية تناسب عدد ضيوفكم.",
          "أضيفوا بيانات التواصل لإرسال طلبكم.",
        ]
      : [
          "Start with your occasion, guest count, venue, and date.",
          "Pick a palette and decor details, or ask Wanas to choose.",
          "Add catering and choose how you’d like it served.",
          "Check your event details and add your contact information.",
        ];
  const eventDescriptions: Record<string, string> =
    locale === "ar"
      ? {
          wedding: "تجربة متكاملة ليوم مميز",
          "katb-el-ketab": "احتفال حميم وتنسيق الكوشة",
          engagement: "احتفال دافئ وبسيط",
          birthday: "جلسة أنيقة لمناسبة خاصة",
          anniversary: "احتفال بذكرى لا تُنسى",
          "private-dinner": "عشاء خاص بتفاصيل مدروسة",
          corporate: "تصميم راقٍ للقاءات العمل",
          other: "مناسبة بتصميم خاص",
        }
      : {
          wedding: "A full day of considered details",
          "katb-el-ketab": "An intimate ceremony with signature styling",
          engagement: "A warm gathering for two families",
          birthday: "A thoughtful setting for a milestone",
          anniversary: "A beautiful way to mark the years",
          "private-dinner": "An intimate dinner, made memorable",
          corporate: "A polished setting for your gathering",
          other: "A celebration shaped around your idea",
        };
  const guestPresets = [
    { value: 40, en: "Intimate", ar: "حميمي", range: "20–60" },
    { value: 90, en: "Medium", ar: "متوسط", range: "60–150" },
    { value: 200, en: "Grand", ar: "كبير", range: "150–300" },
    { value: 350, en: "Extra large", ar: "كبير جدًا", range: "300+" },
  ];
  const budgetLabel = draft.budgetRange
    ? catalogLabel("budgetRanges", draft.budgetRange, locale)
    : "—";
  const venueLabel = draft.venueType
    ? catalogLabel("venueTypes", draft.venueType, locale)
    : "—";
  const cateringLabel = draft.cateringRequested
    ? catalogLabel(
        "cateringOptions",
        draft.cateringOption || "recommend",
        locale,
      )
    : t.notRequested;
  function selectDate(date: string) {
    setDateError("");
    update("eventDate", date);
    touch("eventDate");
    if (date) setVisibleMonth(date.slice(0, 7));
  }
  return (
    <main
      className={styles.shell}
      data-planner
      dir={locale === "ar" ? "rtl" : "ltr"}
    >
      <div className={styles.topbar}>
        <Link className="brand-lockup" href={`/${locale}`}>
          <span>WANAS</span>
          <small>{locale === "ar" ? "أتيليه · القاهرة" : "Atelier · Cairo"}</small>
        </Link>

        <div className={styles.topActions}>
          <span>
            {locale === "ar"
              ? "طلبكم محفوظ في هذه الصفحة"
              : "Draft saved in this tab"}
          </span>
          <Link href={`/${locale}/requests`}>
            {locale === "ar" ? "طلباتي" : "My requests"}
          </Link>
          <Link href={`/${locale === "ar" ? "en" : "ar"}/plan`}>
            {locale === "ar" ? "English" : "العربية"}
          </Link>
        </div>
      </div>
      <div className={styles.content}>
        <nav
          className={styles.progress}
          aria-label={locale === "ar" ? "تقدم التخطيط" : "Planner progress"}
        >
          {steps.map((label, index) => (
            <button
              type="button"
              className={`${styles.progressStep} ${step === index + 1 ? styles.progressCurrent : ""} ${step > index + 1 ? styles.progressDone : ""}`}
              key={label}
              aria-current={step === index + 1 ? "step" : undefined}
              disabled={index + 1 > step}
              onClick={() => goToStep(index + 1)}
            >
              <span aria-hidden="true">
                {step > index + 1 ? "✓" : index + 1}
              </span>
              <span className={styles.stepText}>
                <strong>{label}</strong>
                {step === index + 1 && (
                  <small>
                    {locale === "ar" ? "الخطوة الحالية" : "Current step"}
                  </small>
                )}
              </span>
            </button>
          ))}
        </nav>
        {step > 1 && (
          <dl className={styles.scopeStrip}>
            <div>
              <dt>{t.eventType}</dt>
              <dd>{eventLabel}</dd>
            </div>
            <div>
              <dt>{t.guests}</dt>
              <dd>{draft.guestCount || "—"}</dd>
            </div>
            <div>
              <dt>{t.venueType}</dt>
              <dd>{venueLabel}</dd>
            </div>
            <div>
              <dt>{t.budget}</dt>
              <dd>{budgetLabel}</dd>
            </div>
          </dl>
        )}
        <header className={styles.intro}>
          <div>
            <h1 ref={heading} tabIndex={-1}>
              {title[step - 1]}
            </h1>
            <p>{captions[step - 1]}</p>
          </div>
        </header>
        <div className={step === 2 ? styles.fullLayout : styles.layout}>
          <section className={styles.panel}>
            {step === 1 && (
              <>
                <section className={styles.formSection}>
                  <div className={styles.sectionHeading}>
                    <h2>{t.eventType}</h2>
                  </div>
                  <div className={styles.eventGrid} role="group" aria-label={t.eventType} {...fieldProps("eventType")} tabIndex={-1}>
                    {catalog.eventTypes.map((option) => (
                      <button
                        type="button"
                        key={option.id}
                        onClick={() => update("eventType", option.id)}
                        aria-label={option.labels[locale]}
                        aria-pressed={draft.eventType === option.id}
                        className={`${styles.eventCard} ${draft.eventType === option.id ? styles.cardSelected : ""}`}
                      >
                        <span className={styles.eventType}>
                          {option.labels[locale]}
                        </span>
                        <span className={styles.eventDescription}>
                          {eventDescriptions[option.id] ?? ""}
                        </span>
                      </button>
                    ))}
                  </div>
                  {fieldError("eventType")}
                  {draft.eventType === "other" && (
                    <label>
                      {locale === "ar" ? "وصف المناسبة" : "Describe your event"}
                      <input
                        required
                        {...fieldProps("eventTypeOther")}
                        value={draft.eventTypeOther}
                        onChange={(event) =>
                          update("eventTypeOther", event.target.value)
                        }
                      />
                      {fieldError("eventTypeOther")}
                    </label>
                  )}
                </section>
                <section className={styles.scale}>
                  <div className={styles.sectionHeading}>
                    <h2>
                        {locale === "ar"
                          ? "عدد الضيوف"
                          : "Guest count"}
                      </h2>
                    <strong className={styles.guestNumber}>
                      {draft.guestCount || "—"}{" "}
                      <small>{locale === "ar" ? "ضيفًا" : "guests"}</small>
                    </strong>
                  </div>
                  <div className={styles.presetGrid}>
                    {guestPresets.map((preset) => (
                      <button
                        type="button"
                        key={preset.value}
                        aria-pressed={draft.guestCount === preset.value}
                        className={
                          draft.guestCount === preset.value
                            ? styles.presetActive
                            : ""
                        }
                        onClick={() => update("guestCount", preset.value)}
                      >
                        <b>{locale === "ar" ? preset.ar : preset.en}</b>
                        <small dir="ltr">{preset.range}</small>
                      </button>
                    ))}
                  </div>
                  <label className={styles.rangeLabel}>
                    <input
                      aria-label={
                        locale === "ar"
                          ? "شريط عدد الضيوف"
                          : "Guest count slider"
                      }
                      type="range"
                      min="20"
                      max="400"
                      step="5"
                      value={Math.min(
                        400,
                        Math.max(20, Number(draft.guestCount) || 90),
                      )}
                      onChange={(event) =>
                        update("guestCount", Number(event.target.value))
                      }
                    />
                    <span>
                      {locale === "ar" ? "20 ضيفًا" : "20 guests"}
                      <b><bdi dir="ltr">400+</bdi> {locale === "ar" ? "ضيف" : "guests"}</b>
                    </span>
                  </label>
                  <label className={styles.exactCount}>
                    {t.guests}
                    <input
                      type="number"
                      aria-label={t.guests}
                      required
                      min="1"
                      max="100000"
                      {...fieldProps("guestCount")}
                      value={draft.guestCount}
                      onChange={(event) =>
                        update(
                          "guestCount",
                          event.target.value === ""
                            ? ""
                            : Number(event.target.value),
                        )
                      }
                    />
                    {fieldError("guestCount")}
                  </label>
                  <div className={styles.formula}>
                    <div>
                      <small>
                        {locale === "ar"
                          ? "تخطيط المساحة"
                          : "Seating"}
                      </small>
                      <p>
                        {draft.guestCount
                          ? locale === "ar"
                            ? `نساعدكم في تهيئة المكان لاستقبال ${draft.guestCount} ضيفًا.`
                            : `We’ll help shape a comfortable layout for ${draft.guestCount} guests.`
                          : locale === "ar"
                            ? "اختاروا عدد الضيوف لمعرفة احتياجات المساحة."
                            : "Choose a guest count to plan the right setting."}
                      </p>
                    </div>
                  </div>
                </section>
                <section className={styles.formSection}>
                  <div className={styles.sectionHeading}>
                    <h2>{t.venueType}</h2>
                  </div>
                  <div className={styles.venueGrid} role="group" aria-label={t.venueType} {...fieldProps("venueType")} tabIndex={-1}>
                    {venueOptions.map((option) => (
                      <button
                        type="button"
                        key={option.id}
                        aria-label={option.labels[locale]}
                        aria-pressed={draft.venueType === option.id}
                        onClick={() => update("venueType", option.id)}
                        className={`${styles.venueOption} ${draft.venueType === option.id ? styles.cardSelected : ""}`}
                      >
                        {venueImages[option.id] && (
                          <span className={styles.venueImage}>
                            <Image
                              src={`/atelier/${venueImages[option.id]}.webp`}
                              alt=""
                              fill
                              sizes="(max-width: 760px) 45vw, 30vw"
                            />
                          </span>
                        )}
                        <span className={styles.venueName}>
                          <span aria-hidden="true" />
                          <b>{option.labels[locale]}</b>
                        </span>
                      </button>
                    ))}
                  </div>
                  {fieldError("venueType")}
                  {draft.venueType === "other" && (
                    <label>
                      {locale === "ar" ? "وصف المكان" : "Describe the venue"}
                      <input
                        required
                        {...fieldProps("venueTypeOther")}
                        value={draft.venueTypeOther}
                        onChange={(event) =>
                          update("venueTypeOther", event.target.value)
                        }
                      />
                      {fieldError("venueTypeOther")}
                    </label>
                  )}
                  <div className={styles.fieldGrid}>
                    <label>
                      {t.venue}
                      <input
                        aria-label={t.venue}
                        required
                        {...fieldProps("venueName")}
                        value={draft.venueName}
                        onChange={(event) =>
                          update("venueName", event.target.value)
                        }
                        placeholder={
                          locale === "ar" ? "اسم المكان" : "Venue name"
                        }
                      />
                      {fieldError("venueName")}
                    </label>
                    <label>
                      {t.address}
                      <input
                        aria-label={t.address}
                        required
                        {...fieldProps("streetAddress")}
                        value={draft.streetAddress}
                        onChange={(event) =>
                          update("streetAddress", event.target.value)
                        }
                        placeholder={
                          locale === "ar"
                            ? "المنطقة والشارع"
                            : "Area and street"
                        }
                      />
                      {fieldError("streetAddress")}
                    </label>
                  </div>
                </section>
                <section className={styles.formSection}>
                  <div className={styles.sectionHeading}>
                    <h2>{t.budget}</h2>
                  </div>
                  <div role="group" aria-label={t.budget} {...fieldProps("budgetRange")} tabIndex={-1}>
                    <Options
                      group="budgetRanges"
                      locale={locale}
                      value={draft.budgetRange}
                      onChange={(value) => update("budgetRange", value)}
                    />
                  </div>
                  {fieldError("budgetRange")}
                </section>
                <section className={styles.calendarBlock}>
                  <h2>
                    {locale === "ar"
                      ? "تاريخ المناسبة"
                      : "Event date"}
                  </h2>
                  <p>
                    {locale === "ar"
                      ? "اختاروا موعدًا متاحًا قبل 10 أيام على الأقل."
                      : "Choose a date at least 10 days away."}
                  </p>
                  <div className={styles.calendarLayout}>
                    <label>
                      {t.date}
                      <input
                        type="date"
                        aria-label={t.date}
                        required
                        {...fieldProps("eventDate")}
                        value={draft.eventDate}
                        min={minimumDate}
                        onChange={(event) => selectDate(event.target.value)}
                      />
                      {fieldError("eventDate")}
                    </label>
                    {visibleMonth && (
                      <AvailabilityCalendar
                        month={visibleMonth}
                        selected={draft.eventDate}
                        booked={bookedDates}
                        held={heldDates}
                        minimum={minimumDate}
                        onMonthChange={setVisibleMonth}
                        onSelect={selectDate}
                        locale={locale}
                      />
                    )}
                  </div>
                  {availabilityError && (
                    <p className={styles.message} role="status">
                      {locale === "ar"
                        ? "تعذر تحميل المواعيد المتاحة الآن."
                        : "Availability could not be loaded right now."}
                    </p>
                  )}
                </section>
              </>
            )}
            {step === 2 && (
              <>
                <div className={styles.pathGrid} role="group" aria-label={t.design} {...fieldProps("decorMode")} tabIndex={-1}>
                  <button
                    type="button"
                    aria-pressed={draft.decorMode === "curate"}
                    className={`${styles.pathCard} ${draft.decorMode === "curate" ? styles.cardSelected : ""}`}
                    onClick={() => update("decorMode", "curate")}
                  >
                    <span>
                      <strong>
                        {catalogLabel("decorModes", "curate", locale)}
                      </strong>
                      <small>
                        {locale === "ar"
                          ? "يتولى فريقنا تنسيق الرؤية كاملة."
                          : "Wanas chooses the palette and decor details."}
                      </small>
                    </span>
                  </button>
                  <button
                    type="button"
                    aria-pressed={draft.decorMode === "customize"}
                    className={`${styles.pathCard} ${draft.decorMode === "customize" ? styles.cardSelected : ""}`}
                    onClick={() => update("decorMode", "customize")}
                  >
                    <span>
                      <strong>
                        {catalogLabel("decorModes", "customize", locale)}
                      </strong>
                      <small>
                        {locale === "ar"
                          ? "اختاروا لوحة ألوان وعناصر قريبة منكم."
                          : "Choose a moodboard, palette, and decor details."}
                      </small>
                    </span>
                  </button>
                </div>
                {fieldError("decorMode")}
                {draft.decorMode === "customize" && (
                  <>
                    <MoodboardGallery
                      locale={locale}
                      value={draft.moodboard}
                      onChange={(value) => update("moodboard", value)}
                    />
                    {catalog.palettes.length > 0 && (
                      <fieldset className={styles.choiceSection}>
                        <legend>
                          {locale === "ar"
                            ? "الألوان المفضلة"
                            : "Preferred colors"}
                        </legend>
                        <Options
                          group="palettes"
                          locale={locale}
                          value={draft.palette}
                          allowDelegation
                          onChange={(value) => update("palette", value)}
                        />
                      </fieldset>
                    )}
                    {catalog.decorElements.length > 0 && (
                      <fieldset className={styles.choiceSection}>
                        <legend>
                          {locale === "ar" ? "عناصر الديكور" : "Decor elements"}
                        </legend>
                        <div className={styles.checks}>
                          {catalog.decorElements.map((option) => (
                            <label key={option.id}>
                              <input
                                type="checkbox"
                                checked={draft.decorElements.includes(
                                  option.id,
                                )}
                                onChange={(event) =>
                                  update(
                                    "decorElements",
                                    event.target.checked
                                      ? [...draft.decorElements, option.id]
                                      : draft.decorElements.filter(
                                          (id) => id !== option.id,
                                        ),
                                  )
                                }
                              />
                              {option.labels[locale]}
                            </label>
                          ))}
                        </div>
                        <small>{t.delegated}</small>
                      </fieldset>
                    )}
                  </>
                )}
                <div className={styles.fieldGrid}>
                  <label>
                    {t.notes}
                    <textarea
                      aria-label={t.notes}
                      {...fieldProps("notes")}
                      value={draft.notes}
                      onChange={(event) => update("notes", event.target.value)}
                      placeholder={
                        locale === "ar"
                          ? "ألوان أو طقوس أو تفاصيل تحبونها..."
                          : "Traditions, motifs, or details you love..."
                      }
                    />
                    {fieldError("notes")}
                  </label>
                  <label>
                    {t.links}
                    <input
                      aria-label={t.links}
                      {...fieldProps("inspirationLinks")}
                      value={draft.inspirationLinks}
                      onChange={(event) =>
                        update("inspirationLinks", event.target.value)
                      }
                      placeholder="https://..."
                    />
                    {fieldError("inspirationLinks")}
                  </label>
                </div>
              </>
            )}
            {step === 3 && (
              <>
                <label className={styles.toggle}>
                  <input
                    type="checkbox"
                    checked={draft.cateringRequested}
                    onChange={(event) =>
                      setDraft((current) => ({
                        ...current,
                        cateringRequested: event.target.checked,
                        cateringOption: event.target.checked
                          ? current.cateringOption || "recommend"
                          : "",
                      }))
                    }
                  />
                  {t.includeCatering}
                </label>
                {draft.cateringRequested && (
                  <div className={styles.cateringGrid}>
                    {catalog.cateringOptions.map((option) => (
                      <button
                        type="button"
                        key={option.id}
                        aria-label={option.labels[locale]}
                        aria-pressed={draft.cateringOption === option.id}
                        onClick={() => update("cateringOption", option.id)}
                        className={`${styles.cateringCard} ${draft.cateringOption === option.id ? styles.cardSelected : ""}`}
                      >
                        <strong>{option.labels[locale]}</strong>
                        <small>{cateringDetails[option.id]?.[locale]}</small>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
            {step === 4 && (
              <>
                <dl className={styles.summary}>
                  <div>
                    <dt>{t.eventType}</dt>
                    <dd>
                      {eventLabel}
                      {draft.eventType === "other"
                        ? `: ${draft.eventTypeOther}`
                        : ""}
                    </dd>
                  </div>
                  <div>
                    <dt>{t.guests}</dt>
                    <dd>{draft.guestCount}</dd>
                  </div>
                  <div>
                    <dt>{t.date}</dt>
                    <dd>{draft.eventDate}</dd>
                  </div>
                  <div>
                    <dt>{t.venue}</dt>
                    <dd>{draft.venueName}</dd>
                  </div>
                  <div>
                    <dt>{t.address}</dt>
                    <dd>{draft.streetAddress}</dd>
                  </div>
                  <div>
                    <dt>{t.venueType}</dt>
                    <dd>
                      {catalogLabel("venueTypes", draft.venueType, locale)}
                      {draft.venueType === "other"
                        ? `: ${draft.venueTypeOther}`
                        : ""}
                    </dd>
                  </div>
                  <div>
                    <dt>{t.budget}</dt>
                    <dd>
                      {catalogLabel("budgetRanges", draft.budgetRange, locale)}
                    </dd>
                  </div>
                  <div>
                    <dt>{t.design}</dt>
                    <dd>
                      {draft.decorMode === "curate"
                        ? catalogLabel("decorModes", "curate", locale)
                        : `${draft.moodboard ? catalogLabel("moodboards", draft.moodboard, locale) : t.choose}, ${draft.palette ? catalogLabel("palettes", draft.palette, locale) : t.choose}`}
                    </dd>
                  </div>
                  <div>
                    <dt>{t.catering}</dt>
                    <dd>
                      {draft.cateringRequested
                        ? draft.cateringOption
                          ? catalogLabel(
                              "cateringOptions",
                              draft.cateringOption,
                              locale,
                            )
                          : t.choose
                        : t.notRequested}
                    </dd>
                  </div>
                </dl>
                <div className={styles.fieldGrid}>
                  <label>
                    {t.name}
                    <input
                      aria-label={t.name}
                      required
                      {...fieldProps("customerName")}
                      value={draft.customerName}
                      onChange={(event) =>
                        update("customerName", event.target.value)
                      }
                    />
                    {fieldError("customerName")}
                  </label>
                  <label>
                    {t.mobile}
                    <input
                      aria-label={t.mobile}
                      required
                      type="tel"
                      {...fieldProps("mobile")}
                      value={draft.mobile}
                      onChange={(event) => update("mobile", event.target.value)}
                    />
                    {fieldError("mobile")}
                  </label>
                </div>
              </>
            )}
            <div className={styles.actions}>
              {step > 1 && (
                <button type="button" onClick={() => goToStep(step - 1)}>
                  <span aria-hidden="true">←</span> {t.back}
                </button>
              )}
              {step < 4 ? (
                <button type="button" className={styles.primary} onClick={next}>
                  {t.next} <span aria-hidden="true">→</span>
                </button>
              ) : (
                <button
                  type="button"
                  className={styles.primary}
                  onClick={submit}
                  disabled={submitting}
                >
                  {submitting ? (locale === "ar" ? "جارٍ الإرسال…" : "Sending…") : t.submit} <span aria-hidden="true">→</span>
                </button>
              )}
            </div>
          </section>
          {step !== 2 && (
            <aside className={styles.aside}>
              <h2>
                {locale === "ar" ? "ملخص المناسبة" : "Event summary"}
              </h2>
              <div className={styles.estimate}>
                <small>
                  {locale === "ar"
                    ? "ميزانيتكم المختارة"
                    : "Selected budget"}
                </small>
                <strong>{budgetLabel}</strong>
              </div>
              <dl className={styles.asideDetails}>
                <div>
                  <dt>{t.eventType}</dt>
                  <dd>{eventLabel}</dd>
                </div>
                <div>
                  <dt>{t.guests}</dt>
                  <dd>{draft.guestCount || "—"}</dd>
                </div>
                <div>
                  <dt>{t.date}</dt>
                  <dd>{draft.eventDate || "—"}</dd>
                </div>
                <div>
                  <dt>{t.venueType}</dt>
                  <dd>{venueLabel}</dd>
                </div>
                {step >= 3 && (
                  <div>
                    <dt>{t.catering}</dt>
                    <dd>{cateringLabel}</dd>
                  </div>
                )}
              </dl>
              <p className={styles.asideNote}>
                {locale === "ar"
                  ? "يرسل فريق وناس عرض السعر بعد مراجعة طلبكم."
                  : "WANAS will send a quote after reviewing your request."}
              </p>
            </aside>
          )}
        </div>
      </div>
    </main>
  );
}
