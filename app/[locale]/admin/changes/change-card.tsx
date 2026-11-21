"use client";

import Link from "next/link";
import { useId, useState, type ReactNode } from "react";
import styles from "./changes.module.css";

export function ChangeCard({ initialOpen, summary, reviewLabel, requestUrl, requestLabel, children }: {
  initialOpen: boolean;
  summary: ReactNode;
  reviewLabel: string;
  requestUrl: string;
  requestLabel: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(initialOpen);
  const panel = useId();
  return (
    <article className={styles.card} data-open={open}>
      <div className={styles.summary}>
        {summary}
        <div className={styles.actions}>
          <button className={styles.review} type="button" aria-expanded={open} aria-controls={panel} onClick={() => setOpen(!open)}>
            {reviewLabel}<span aria-hidden="true" />
          </button>
          <Link href={requestUrl}>{requestLabel}</Link>
        </div>
      </div>
      <div className={styles.drawer} id={panel} hidden={!open}>{children}</div>
    </article>
  );
}
