export type Continent = 'Africa' | 'South America' | 'North America' | 'Central America' | 'Europe' | 'Asia' | 'Oceania';

export type Gender = 'male' | 'female' | 'trans';

export type VisitedMonth =
  | 'January'
  | 'February'
  | 'March'
  | 'April'
  | 'May'
  | 'June'
  | 'July'
  | 'August'
  | 'September'
  | 'October'
  | 'November'
  | 'December';

export interface IndividualInfo {
  rating: number | null;
  countryCode: string;
  prefixCode: string | null;
  continent: Continent;
  fullName: string;
  birthplace: string | null;
  livingIn: string | null;
  birthyear: number | null;
  occupation: string[];
  urlProfileCs: string | number | null;
  gender: Gender;
  whatsapp: string | null;
  instagram: string | null;
}

interface GuestSharedFields {
  guestId: string;
  nights: number;
  stayed: boolean;
  didWeHangOut: boolean;
  visitedMonth: VisitedMonth;
  visitedYear: number;
  gift: string[] | null;
  comments: string | null;
  wasACouple: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SoloGuest extends GuestSharedFields, IndividualInfo {
  wasACouple: false;
  coupleId: null;
}

export interface CoupleGuest extends GuestSharedFields {
  wasACouple: true;
  coupleId: string;
  coupleInfo: [IndividualInfo, IndividualInfo];
}

export type Guest = SoloGuest | CoupleGuest;

// ─── Flattened paginated response (no nested data.data) ──────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>[];
}

// Paginated API response — merges pagination fields at the top level
export interface PaginatedApiResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
