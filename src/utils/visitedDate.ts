/**
 * Parses a visitedDate string into a JS Date for sorting/filtering.
 * Supports:
 *   - "November 2025"       → 2025-11-01
 *   - "March 2026"          → 2026-03-01
 *   - "08 June 2026"        → 2026-06-08
 *   - "15 May 2026"         → 2026-05-15
 *   - "21 May 2026"         → 2026-05-21
 */

const MONTHS: Record<string, number> = {
  january: 0,
  february: 1,
  march: 2,
  april: 3,
  may: 4,
  june: 5,
  july: 6,
  august: 7,
  september: 8,
  october: 9,
  november: 10,
  december: 11,
};

export function parseVisitedDate(raw: string): Date {
  const parts = raw.trim().split(/\s+/);

  // "Month Year" → 2 parts
  if (parts.length === 2) {
    const [monthStr, yearStr] = parts;
    const month = MONTHS[monthStr.toLowerCase()];
    const year = parseInt(yearStr, 10);
    if (month !== undefined && !isNaN(year)) {
      return new Date(year, month, 1);
    }
  }

  // "DD Month Year" → 3 parts
  if (parts.length === 3) {
    const [dayStr, monthStr, yearStr] = parts;
    const day = parseInt(dayStr, 10);
    const month = MONTHS[monthStr.toLowerCase()];
    const year = parseInt(yearStr, 10);
    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      return new Date(year, month, day);
    }
  }

  // Fallback: try native Date parse
  const fallback = new Date(raw);
  return isNaN(fallback.getTime()) ? new Date() : fallback;
}

/**
 * Parses a query param like "november-2022" or "june-2026" into a Date.
 * Returns null if invalid.
 */
export function parseMonthYearParam(param: string): Date | null {
  const parts = param.toLowerCase().split('-');
  if (parts.length !== 2) return null;
  const [monthStr, yearStr] = parts;
  const month = MONTHS[monthStr];
  const year = parseInt(yearStr, 10);
  if (month === undefined || isNaN(year) || year < 2007) return null;
  return new Date(year, month, 1);
}
