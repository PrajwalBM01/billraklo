// Fixed locale and time zone so a date renders the same wherever it's formatted,
// e.g. "10 Nov 2026". Call it on the server and pass the string to client components.
const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

export function formatDate(date: Date | string | number) {
  return dateFormatter.format(new Date(date));
}
