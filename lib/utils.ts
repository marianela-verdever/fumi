const MONTHS_ES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

const MONTHS_SHORT_ES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
];

export function calculateAge(birthDate: string): string {
  const birth = new Date(birthDate);
  const now = new Date();

  let months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
  let days = now.getDate() - birth.getDate();

  if (days < 0) {
    months -= 1;
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
  }

  if (months === 0) {
    return `${days} día${days !== 1 ? 's' : ''}`;
  }

  const monthStr = `${months} mes${months !== 1 ? 'es' : ''}`;
  const dayStr = `${days} día${days !== 1 ? 's' : ''}`;

  return `${monthStr}, ${dayStr}`;
}

export function formatDate(date: string): string {
  const d = new Date(date);
  const day = d.getDate();
  const month = MONTHS_SHORT_ES[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export function formatDateLong(date: string): string {
  const d = new Date(date);
  const day = d.getDate();
  const month = MONTHS_ES[d.getMonth()];
  const year = d.getFullYear();
  return `${day} de ${month} de ${year}`;
}

export function getTodayFormatted(): string {
  return formatDate(new Date().toISOString());
}

export function getTodayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function getMonthPeriod(month: number, birthDate: string): string {
  const birth = new Date(birthDate);
  const startMonth = new Date(birth.getFullYear(), birth.getMonth() + month - 1, 1);
  const endMonth = new Date(birth.getFullYear(), birth.getMonth() + month, 0);

  const startLabel = `${MONTHS_SHORT_ES[startMonth.getMonth()]} ${startMonth.getFullYear()}`;
  const endLabel = `${MONTHS_SHORT_ES[endMonth.getMonth()]} ${endMonth.getFullYear()}`;

  if (startLabel === endLabel) return startLabel;
  return `${startLabel} — ${endLabel}`;
}

/** Given an entry date and birth date, returns which month of baby's life (1-based). */
export function getMonthNumber(date: string, birthDate: string): number {
  const d = new Date(date);
  const b = new Date(birthDate);
  const months = (d.getFullYear() - b.getFullYear()) * 12 + (d.getMonth() - b.getMonth());
  // If the day is before the birth day in the month, it's the previous month
  if (d.getDate() < b.getDate()) {
    return Math.max(1, months);
  }
  return Math.max(1, months + 1);
}

/** Returns the date range label for a year section (e.g., "Ene 2025 — Dic 2025"). */
export function getYearPeriod(year: number, birthDate: string, totalMonths: number): string {
  const birth = new Date(birthDate);
  const firstMonth = (year - 1) * 12 + 1; // e.g., Year 1 → month 1, Year 2 → month 13
  const lastMonth = Math.min(year * 12, totalMonths); // cap to actual months

  const start = new Date(birth.getFullYear(), birth.getMonth() + firstMonth - 1, 1);
  const end = new Date(birth.getFullYear(), birth.getMonth() + lastMonth, 0);

  const startLabel = `${MONTHS_SHORT_ES[start.getMonth()]} ${start.getFullYear()}`;
  const endLabel = `${MONTHS_SHORT_ES[end.getMonth()]} ${end.getFullYear()}`;

  if (startLabel === endLabel) return startLabel;
  return `${startLabel} — ${endLabel}`;
}

/** Returns how many months old the baby is (from birth to today). */
export function getTotalMonths(birthDate: string): number {
  const now = new Date();
  const b = new Date(birthDate);
  const months = (now.getFullYear() - b.getFullYear()) * 12 + (now.getMonth() - b.getMonth());
  if (now.getDate() < b.getDate()) {
    return Math.max(1, months);
  }
  return Math.max(1, months + 1);
}
