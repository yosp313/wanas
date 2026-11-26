import styles from "./route-state.module.css";

export function RouteLoading({ message }: { message?: string }) {
  return (
    <main className={styles.loading}>
      <p role="status">
        <span className={styles.spinner} aria-hidden="true" />
        {message ?? <>
          <span lang="en">Loading…</span>
          <span lang="ar">جارٍ التحميل…</span>
        </>}
      </p>
    </main>
  );
}
