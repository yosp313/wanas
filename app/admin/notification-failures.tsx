export type NotificationFailure = { id: string; type: string; providerCode: string; failedAt: Date; recipient?: string };

/** Admin-only presentation seam. The server must pass the verified is_admin result. */
export function NotificationFailureList({ failures, isAdmin }: { failures: NotificationFailure[]; isAdmin: boolean }) {
  if (!isAdmin) return null;
  if (failures.length === 0) return <p>No notification failures need attention.</p>;
  return <section aria-labelledby="notification-failures-heading"><h2 id="notification-failures-heading">Notification failures</h2><ul>{failures.map((failure) => <li key={failure.id}>{failure.type} ({failure.providerCode})<time dateTime={failure.failedAt.toISOString()}> {failure.failedAt.toLocaleString()}</time></li>)}</ul></section>;
}
