import { GuestQueryInput } from './validation';

const MAX_PAGE_SIZE = 170;

const getStartDate = (date: string): string => {
  if (/^\d{4}$/.test(date)) return `${date}-01-01`;
  if (/^\d{4}-\d{2}$/.test(date)) return `${date}-01`;

  return date;
};

const getNextDate = (date: string): string => {
  const [year, month, day] = date.split('-').map(Number);

  if (/^\d{4}$/.test(date)) return `${year + 1}-01-01`;

  if (/^\d{4}-\d{2}$/.test(date)) {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    return `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
  }

  const nextDate = new Date(Date.UTC(year, month - 1, day + 1));
  return nextDate.toISOString().slice(0, 10);
};

const getBirthDateRegex = (birthDate: string): string => {
  if (birthDate.startsWith('--')) return `^\\d{4}-\\d{2}-${birthDate.slice(2)}$`;
  if (/^\d{2}$/.test(birthDate)) return `^\\d{4}-${birthDate}(?:-|$)`;
  if (/^\d{2}-\d{2}$/.test(birthDate)) return `^\\d{4}-${birthDate}$`;
  return `^${birthDate}`;
};

export const parsePagination = (query: GuestQueryInput) => {
  const page = Math.max(1, Number(query.page ?? 1));
  const limit = Math.min(MAX_PAGE_SIZE, Math.max(1, parseInt(query.limit ?? '10', 10)));

  return {
    page,
    limit,
    skip: (page - 1) * limit,
  };
};

export const buildVisitedDateFilter = (from?: string, to?: string): Record<string, unknown> => {
  if (!from && !to) return {};

  const conditions: Record<string, string> = {
    ...(from && { $gte: getStartDate(from) }),
    ...(to && { $lt: getNextDate(to) }),
  };

  return { visitedDate: conditions };
};

export const buildBirthDateFilter = (birthDate?: string): Record<string, unknown> => {
  if (!birthDate) return {};

  return {
    birthDate: { $regex: getBirthDateRegex(birthDate) },
  };
};

export const buildLocationNameFilter = (field: 'livingIn' | 'hometown', value: string): Record<string, unknown> => {
  const normalizedValue = value.trim().toLowerCase().replace(/-/g, ' ').replace(/\s+/g, ' ');

  const regexValue = normalizedValue
    .split(' ')
    .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('[\\s-]+');

  return { [field]: { $regex: `(?:,\\s*)?${regexValue}$`, $options: 'i' } };
};
