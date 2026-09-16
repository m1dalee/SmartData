/** Cycle de paye et compte à rebours avant la prochaine paie. */

export type PayCycleRange = {
  start: string;
  end: string;
  cycleKey: string;
};

export type NextPaydayInfo = {
  daysUntilStart: number;
  /** Ex. « 3-5 octobre » */
  label: string;
  isPaydayWindow: boolean;
};

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function clampDay(year: number, month: number, day: number): number {
  const last = new Date(year, month + 1, 0).getDate();
  return Math.min(Math.max(1, day), last);
}

/** Période du budget : du jour de paye au veille du prochain. */
export function getPayCycleRange(
  referenceDate: Date = new Date(),
  paydayStartDay = 3,
): PayCycleRange {
  const y = referenceDate.getFullYear();
  const m = referenceDate.getMonth();
  const day = referenceDate.getDate();

  let startYear = y;
  let startMonth = m;
  if (day < paydayStartDay) {
    startMonth -= 1;
    if (startMonth < 0) {
      startMonth = 11;
      startYear -= 1;
    }
  }

  const safeStartDay = clampDay(startYear, startMonth, paydayStartDay);
  const start = new Date(startYear, startMonth, safeStartDay);

  let endYear = startMonth === 11 ? startYear + 1 : startYear;
  let endMonth = startMonth === 11 ? 0 : startMonth + 1;
  const endDay = clampDay(endYear, endMonth, paydayStartDay - 1);
  const end = new Date(endYear, endMonth, endDay);

  return {
    start: toIsoDate(start.getFullYear(), start.getMonth(), start.getDate()),
    end: toIsoDate(end.getFullYear(), end.getMonth(), end.getDate()),
    cycleKey: `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`,
  };
}

export function getNextPaydayInfo(
  referenceDate: Date = new Date(),
  paydayStartDay = 3,
  paydayEndDay = 5,
): NextPaydayInfo {
  const y = referenceDate.getFullYear();
  const m = referenceDate.getMonth();
  const day = referenceDate.getDate();

  const isPaydayWindow = day >= paydayStartDay && day <= paydayEndDay;

  let targetYear = y;
  let targetMonth = m;

  if (day > paydayEndDay || isPaydayWindow) {
    targetMonth += 1;
    if (targetMonth > 11) {
      targetMonth = 0;
      targetYear += 1;
    }
  }

  const startDate = new Date(targetYear, targetMonth, clampDay(targetYear, targetMonth, paydayStartDay));
  const today = new Date(y, m, day);
  const msPerDay = 86_400_000;
  const daysUntilStart = Math.max(
    0,
    Math.ceil((startDate.getTime() - today.getTime()) / msPerDay),
  );

  const monthLabel = startDate.toLocaleDateString("fr-FR", { month: "long" });
  const label = `${paydayStartDay}-${paydayEndDay} ${monthLabel}`;

  return { daysUntilStart, label, isPaydayWindow };
}

export function formatPayCycleLabel(start: string, end: string): string {
  const startDate = new Date(start + "T12:00:00");
  const endDate = new Date(end + "T12:00:00");
  const fmt = (d: Date) =>
    d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" }).replace(".", "");
  return `${fmt(startDate)} → ${fmt(endDate)}`;
}
