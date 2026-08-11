/**
 * The date the client trained, in their own timezone. Not `toISOString()`: a
 * session finished at half past eleven at night in Spain would be filed as
 * tomorrow in UTC, and the server would refuse a date in the future.
 */
export function localDateISO(now: Date): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
