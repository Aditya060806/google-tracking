/** "2026-11-12" becomes "12 Nov 2026" (or "12 Nov" without the year). */
export function formatReportDate(isoDate: string, options: { year?: boolean } = {}): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    ...(options.year === false ? {} : { year: "numeric" }),
    timeZone: "UTC",
  }).format(new Date(`${isoDate}T00:00:00Z`));
}
