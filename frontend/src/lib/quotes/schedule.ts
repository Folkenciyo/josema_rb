/** Local ISO day: `toISOString()` slides to yesterday west of UTC. */
export function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

function daysBetween(from: string, to: string): number {
  const [fromYear, fromMonth, fromDay] = from.split("-").map(Number);
  const [toYear, toMonth, toDay] = to.split("-").map(Number);
  // Built at noon so a daylight-saving jump cannot land on the previous day.
  const start = new Date(fromYear, fromMonth - 1, fromDay, 12);
  const end = new Date(toYear, toMonth - 1, toDay, 12);
  return Math.round((end.getTime() - start.getTime()) / 86_400_000);
}

/**
 * How a day of the queue reads: the two nearest ones by name, the rest by date.
 * "El jueves" beats "23/08" for anything inside the coming week.
 */
export function dayLabel(isoDate: string, today = todayIso()): string {
  const distance = daysBetween(today, isoDate);

  if (distance === 0) {
    return "Hoy";
  }
  if (distance === 1) {
    return "Mañana";
  }

  const [year, month, day] = isoDate.split("-").map(Number);
  const when = new Date(year, month - 1, day, 12);

  if (distance > 1 && distance < 7) {
    return new Intl.DateTimeFormat("es-ES", { weekday: "long" }).format(when);
  }

  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "short",
  }).format(when);
}
