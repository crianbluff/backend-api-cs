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

/**
 * Parses a query param like "november-2022" into a sort key (YYYYMM).
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
