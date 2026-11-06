// ─── Pagination ───────────────────────────────────────────────────────────────
export interface IPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  monthlyStats: YearlyStat[];
  pagination: IPagination;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>[];
}

export interface PaginatedApiResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  monthlyStats: YearlyStat[];
  pagination: IPagination;
}

export interface MonthlyStat {
  month: number;
  totalVisits: number;
  totalPeople: number;
}

export interface YearlyStat {
  year: number;
  totalVisits: number;
  totalPeople: number;
  months: MonthlyStat[];
}
