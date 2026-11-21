import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import styles from "./wanas-wordmark.module.css";

export function WanasWordmark({ locale }: { locale: Locale }) {
  return (
    <Link className={styles.wordmark} href={`/${locale}`}>
      <span dir="ltr">WANAS <bdi lang="ar">وَنَس</bdi></span>
    </Link>
  );
}
