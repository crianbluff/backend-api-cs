import { VisitedMonth } from '../types/guest.types';

const MONTHS: VisitedMonth[] = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

/** Parses "november-2022" → { month, year } or null if invalid. */
export function parseDateParam(param: string): { month: VisitedMonth; year: number } | null {
  const parts = param.toLowerCase().split('-');
  if (parts.length !== 2) return null;
  const [rawMonth, rawYear] = parts;
  const year = parseInt(rawYear, 10);
  if (isNaN(year) || year < 2007) return null;
  const month = MONTHS.find((m) => m.toLowerCase() === rawMonth);
  if (!month) return null;
  return { month, year };
}

export function toSortKey(month: VisitedMonth, year: number): number {
  return year * 12 + MONTHS.indexOf(month);
}

/**
 * Builds a MongoDB $expr filter for visited date range.
 * Uses a computed numeric sort key: year*12 + monthIndex.
 */
export function buildDateRangeFilter(from?: string, to?: string): Record<string, unknown> {
  const conditions: unknown[] = [];
  const computedKey = {
    $add: [{ $multiply: ['$visitedYear', 12] }, { $indexOfArray: [MONTHS, '$visitedMonth'] }],
  };

  if (from) {
    const parsed = parseDateParam(from);
    if (parsed) conditions.push({ $gte: [computedKey, toSortKey(parsed.month, parsed.year)] });
  }
  if (to) {
    const parsed = parseDateParam(to);
    if (parsed) conditions.push({ $lte: [computedKey, toSortKey(parsed.month, parsed.year)] });
  }

  if (conditions.length === 0) return {};
  return { $expr: conditions.length === 1 ? conditions[0] : { $and: conditions } };
}
