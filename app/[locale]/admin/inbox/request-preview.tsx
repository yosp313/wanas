import Image from "next/image";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { CalendarIcon } from "../calendar/icons";
import styles from "./inbox.module.css";

type Preview = {
  id: string;
  name: string;
  status: string;
  statusLabel: string;
  date: string;
  dateLabel: string;
  event: string;
  guests: string;
  email: string;
  phone: string;
  budget: string;
  venue?: string;
  decor?: string;
  moodboard?: string;
  moodboardImage?: string;
  palette?: string;
  catering?: string;
  notes?: string;
};

export function RequestPreview({ request, locale }: { request: Preview; locale: Locale }) {
  const ar = locale === "ar";
  const actionable = request.status === "submitted" || request.status === "quoted";
  return (
    <article className={styles.preview} id="request-preview" aria-labelledby="preview-title" tabIndex={-1}>
      <header className={styles.previewHeader}>
        <div>
          <div className={styles.reference}>
            <span className={styles.status} data-status={request.status}>{request.statusLabel}</span>
            <bdi title={request.id}>#{request.id.slice(0, 8).toUpperCase()}</bdi>
          </div>
          <h2 id="preview-title"><bdi>{request.name}</bdi></h2>
          <p>
            {request.event && <><bdi>{request.event}</bdi> · </>}
            {request.guests && <>{request.guests} · </>}
            <time dateTime={request.date}>{request.dateLabel}</time>
          </p>
        </div>
        {request.budget && (
          <div className={styles.budget}>
            <span>{ar ? "الميزانية المقدّرة" : "Estimated budget"}</span>
            <strong><bdi>{request.budget}</bdi></strong>
          </div>
        )}
      </header>

      <div className={styles.previewBody}>
        <dl className={styles.contacts}>
          <div>
            <dt>{ar ? "البريد الإلكتروني" : "Email"}</dt>
            <dd><bdi dir="ltr">{request.email}</bdi></dd>
          </div>
          <div>
            <dt>{ar ? "الهاتف" : "Phone"}</dt>
            <dd><bdi dir="ltr">{request.phone}</bdi></dd>
          </div>
          {request.venue && (
            <div>
              <dt>{ar ? "المكان المفضّل" : "Venue preference"}</dt>
              <dd><bdi>{request.venue}</bdi></dd>
            </div>
          )}
        </dl>

        {(request.moodboard || request.palette || request.decor) && (
          <section className={styles.moodboard}>
            <header>
              <h3>{ar ? "الديكور ولوحة الإلهام" : "Decor & moodboard"}</h3>
              {request.palette && <p><bdi>{request.palette}</bdi></p>}
            </header>
            {request.moodboardImage ? (
              <figure>
                <Image fill loading="eager" sizes="(min-width: 781px) 45vw, 90vw" src={`/atelier/${request.moodboardImage}.webp`} alt="" />
                <figcaption><bdi>{request.moodboard}</bdi></figcaption>
              </figure>
            ) : <p><bdi>{request.moodboard || request.decor}</bdi></p>}
          </section>
        )}

        {request.catering && (
          <section className={styles.catering}>
            <h3>{ar ? "الضيافة" : "Catering selection"}</h3>
            <div><span><CalendarIcon name="catering" /></span><bdi>{request.catering}</bdi></div>
          </section>
        )}

        {request.notes && (
          <section className={styles.notes}>
            <h3>{ar ? "ملاحظات العميل" : "Client notes"}</h3>
            <blockquote dir="auto">{request.notes}</blockquote>
          </section>
        )}

        <Link className={styles.primary} href={`/${locale}/admin/requests/${request.id}`}>
          <CalendarIcon name={actionable ? "send" : "quote"} />
          {actionable
            ? (ar ? "مراجعة وإرسال عرض السعر" : "Review & send proposal")
            : (ar ? "عرض تفاصيل الطلب" : "View request details")}
        </Link>
      </div>
    </article>
  );
}
