/**
 * Local calendar date as "YYYY-MM-DD" (same output as toLocaleDateString('en-CA')).
 * Built by hand because the first Intl/toLocale* call loads locale data, which cost
 * ~100 ms of startup time on slow phones just to render the daily-streak banner.
 */
export function localDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
