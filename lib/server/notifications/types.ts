export type NotificationType =
  | "request_submitted"
  | "quote_ready"
  | "request_declined"
  | "booking_confirmed"
  | "booking_cancelled"
  | "booking_rescheduled";

export type NotificationLocale = "ar" | "en";

export type NotificationPayload = {
  recipient: string;
  customerName?: string;
  locale: NotificationLocale;
  requestId: string;
  quoteId?: string;
  bookingId?: string;
  offeredDate?: string;
  totalEgp?: number;
  scopeExplanation?: string;
  newDate?: string;
  explanation?: string;
};

export type NotificationJob = {
  id: string;
  claimToken: string;
  type: NotificationType;
  payload: NotificationPayload;
  attempts: number;
};

export type NotificationEvent = Omit<NotificationJob, "id" | "claimToken" | "attempts">;

export type QuoteCheck = "current" | "obsolete";

export interface NotificationRepository {
  claimDue(now: Date, leaseMs: number, limit: number): Promise<NotificationJob[]>;
  markSent(id: string, claimToken: string, sentAt: Date): Promise<void>;
  markSkipped(id: string, claimToken: string, reason: string, at: Date): Promise<void>;
  scheduleRetry(id: string, claimToken: string, nextAttemptAt: Date, errorCode: string, at: Date): Promise<void>;
  markFailed(id: string, claimToken: string, errorCode: string, at: Date): Promise<void>;
  checkQuote?(job: NotificationJob, now: Date): Promise<QuoteCheck>;
}

export type Mail = { to: string; subject: string; html: string; text: string };
