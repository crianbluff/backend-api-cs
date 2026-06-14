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

export function buildDateRangeFilter(from?: string, to?: string): Record<string, unknown> {
  const conditions: unknown[] = [];
  const key = { $add: [{ $multiply: ['$visitedYear', 12] }, { $indexOfArray: [MONTHS, '$visitedMonth'] }] };
  if (from) {
    const p = parseDateParam(from);
    if (p) conditions.push({ $gte: [key, toSortKey(p.month, p.year)] });
  }
  if (to) {
    const p = parseDateParam(to);
    if (p) conditions.push({ $lte: [key, toSortKey(p.month, p.year)] });
  }
  if (conditions.length === 0) return {};
  return { $expr: conditions.length === 1 ? conditions[0] : { $and: conditions } };
}
