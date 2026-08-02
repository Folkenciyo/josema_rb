const dateFormatter = new Intl.DateTimeFormat("es-ES", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

/** Backend dates are plain ISO days (`YYYY-MM-DD`), parsed as local time on purpose. */
export function formatDate(isoDate: string | null): string {
  if (!isoDate) {
    return "—";
  }

  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  return dateFormatter.format(new Date(year, month - 1, day));
}

export function formatDateRange(
  start: string | null,
  end: string | null,
): string {
  if (!start && !end) {
    return "Sin fechas";
  }
  return `${formatDate(start)} → ${formatDate(end)}`;
}

export function calculateAge(birthDate: string | null): number | null {
  if (!birthDate) {
    return null;
  }

  const [year, month, day] = birthDate.slice(0, 10).split("-").map(Number);
  const today = new Date();
  let age = today.getFullYear() - year;

  const hasHadBirthday =
    today.getMonth() + 1 > month ||
    (today.getMonth() + 1 === month && today.getDate() >= day);

  if (!hasHadBirthday) {
    age -= 1;
  }

  return age;
}
