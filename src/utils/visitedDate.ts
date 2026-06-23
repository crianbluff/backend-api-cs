/**
 * Utilities for parsing visitedDate strings for filtering purposes.
 *
 * Supported formats:
 *   - "May 2026"       → month + year
 *   - "05 May 2026"    → day + month + year
 *   - "November 2025"  → month + year
 *   - "08 June 2026"   → day + month + year
 */

const MONTHS: Record<string, number> = {
  january: 1,
  february: 2,
  march: 3,
  april: 4,
  may: 5,
  june: 6,
  july: 7,
  august: 8,
  september: 9,
  october: 10,
  november: 11,
  december: 12,
};

export interface ParsedVisitedDate {
  year: number;
  month: number; // 1–12
  day: number; // 1 if not provided
}

/**
 * Parses a visitedDate string into { year, month, day }.
 * Returns null if the string cannot be parsed.
 */
export function parseVisitedDate(raw: string): ParsedVisitedDate | null {
  const parts = raw.trim().split(/\s+/);

  // "Month Year" → 2 parts
  if (parts.length === 2) {
    const [monthStr, yearStr] = parts;
    const month = MONTHS[monthStr.toLowerCase()];
    const year = parseInt(yearStr, 10);
    if (month !== undefined && !isNaN(year)) {
      return { year, month, day: 1 };
    }
  }

  // "DD Month Year" → 3 parts
  if (parts.length === 3) {
    const [dayStr, monthStr, yearStr] = parts;
    const day = parseInt(dayStr, 10);
    const month = MONTHS[monthStr.toLowerCase()];
    const year = parseInt(yearStr, 10);
    if (!isNaN(day) && month !== undefined && !isNaN(year)) {
      return { year, month, day };
    }
  }

  return null;
}

/**
 * Converts a ParsedVisitedDate to a numeric sort key: YYYYMM (ignores day for range filtering).
 * e.g. { year: 2026, month: 5 } → 202605
 */
export function toSortKey(parsed: ParsedVisitedDate): number {
  return parsed.year * 100 + parsed.month;
}

/**
 * Parses a query param like "november-2022" or "june-2026" into a sort key.
 * Returns null if invalid.
 */
export function parseMonthYearParam(param: string): number | null {
  const parts = param.toLowerCase().split('-');
  if (parts.length !== 2) return null;
  const [monthStr, yearStr] = parts;
  const month = MONTHS[monthStr];
  const year = parseInt(yearStr, 10);
  if (month === undefined || isNaN(year) || year < 2007) return null;
  return year * 100 + month;
}
