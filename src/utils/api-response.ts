import { GuestQueryInput } from './validation';

const MAX_LIMIT_PER_PAG = 170;

export const parsePagination = (query: GuestQueryInput) => {
  const page = Math.max(1, Number(query.page ?? 1));
  const limit = Math.min(MAX_LIMIT_PER_PAG, Math.max(1, parseInt(query.limit ?? '10', 10)));
  return { page, limit, skip: (page - 1) * limit };
};

export const buildVisitedDateFilter = (from?: string, to?: string): Record<string, unknown> => {
  if (!from && !to) return {};
  // ISO 8601 string comparison works lexicographically for YYYY, YYYY-MM, YYYY-MM-DD
  const conditions: Record<string, string> = {};
  if (from) conditions['$gte'] = from;
  if (to) conditions['$lte'] = to;
  return { visitedDate: conditions };
};
