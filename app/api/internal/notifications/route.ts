import { timingSafeEqual } from "node:crypto";
import { getNotificationRepository } from "@/lib/server/notifications/repository";
import { processNotifications } from "@/lib/server/notifications/worker";

function isAuthorized(request: Request, secret: string | undefined) {
  const header = request.headers.get("authorization");
  if (!secret || !header?.startsWith("Bearer ")) return false;
  const actual = Buffer.from(header.slice(7));
  const expected = Buffer.from(secret);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function getTestTransport(): typeof fetch | undefined {
  if (process.env.NODE_ENV === "production" || process.env.NOTIFICATION_TEST_TRANSPORT !== "loopback") return;
  const url = new URL(process.env.NOTIFICATION_TEST_URL ?? "");
  if (url.protocol !== "http:" || !["127.0.0.1", "[::1]"].includes(url.hostname) || url.username || url.password) {
    throw new Error("Invalid loopback mail endpoint");
  }
  return (_, init) => fetch(url, { ...init, redirect: "error" });
}

export async function POST(request: Request) {
  if (!isAuthorized(request, process.env.NOTIFICATION_CRON_SECRET)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { APP_ORIGIN, RESEND_API_KEY, EMAIL_FROM } = process.env;
  if (!APP_ORIGIN || !RESEND_API_KEY || !EMAIL_FROM) {
    return Response.json({ error: "Notification worker is not configured" }, { status: 503 });
  }

  try {
    const summary = await processNotifications(getNotificationRepository(), {
      appOrigin: APP_ORIGIN,
      resendApiKey: RESEND_API_KEY,
      emailFrom: EMAIL_FROM,
      logger: console,
      fetcher: getTestTransport(),
    });
    return Response.json(summary);
  } catch {
    console.error("notification_worker_failed");
    return Response.json({ error: "Worker unavailable" }, { status: 500 });
  }
}
