import type { Locale } from "@/lib/i18n/config";

const quoteStatuses: Record<string, [string, string]> = {
  current: ["Awaiting response", "بانتظار الرد"],
  accepted: ["Accepted", "مقبول"],
  declined: ["Declined", "مرفوض"],
  declined_by_admin: ["Declined by WANAS", "رفضه وناس"],
  expired: ["Expired", "انتهت صلاحيته"],
  superseded: ["Replaced", "تم استبداله"],
  withdrawn: ["Withdrawn", "تم سحبه"],
};

export function QuoteTerms({ quote, locale }: {
  quote: {
    status: string;
    offeredDate: string;
    totalEgp: number;
    services: unknown;
    scopeExplanation: string | null;
  };
  locale: Locale;
}) {
  const ar = locale === "ar";
  const total = new Intl.NumberFormat(ar ? "ar-EG" : "en-EG", { style: "currency", currency: "EGP", numberingSystem: "latn" }).format(quote.totalEgp);
  const services = typeof quote.services === "string" ? quote.services : "";
  const status = quoteStatuses[quote.status]?.[ar ? 1 : 0];
  return (
    <div>
      <p data-quote-summary>
        <time dateTime={quote.offeredDate}>{quote.offeredDate}</time>{" "}
        <span aria-hidden="true">·</span>{" "}
        <bdi>{total}</bdi>
        {status && <> <span aria-hidden="true">·</span>{" "}<span data-quote-status={quote.status}>{status}</span></>}
      </p>
      {(services || quote.scopeExplanation) && (
        <div data-quote-description>
          {services && <p dir="auto">{services}</p>}
          {quote.scopeExplanation && <p dir="auto">{quote.scopeExplanation}</p>}
        </div>
      )}
    </div>
  );
}
