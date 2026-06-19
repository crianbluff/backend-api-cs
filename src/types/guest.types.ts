export type Continent = 'Africa' | 'America' | 'Europe' | 'Asia' | 'Oceania';

export type Region =
  | 'North America'
  | 'Central America'
  | 'South America'
  | 'Caribe'
  | 'Middle East Asia'
  | 'Southeast Asia'
  | 'Eastern Asia'
  | 'South Asia'
  | 'Central Asia'
  | 'West Europe'
  | 'Scandinavia'
  | 'Southern Europe'
  | 'Northern Europe'
  | 'Eastern Europe'
  | 'Oceania'
  | 'Africa';

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

export type Gender = 'male' | 'female' | 'trans';

export interface IndividualInfo {
  rating: number | null;
  countryCode: string;
  prefixCode: string | null;
  continent: Continent;
  region: Region;
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
  /** Raw string as provided e.g. "November 2025" or "08 June 2026" */
  visitedDate: string;
  /** Computed Date used for sorting/filtering. Day defaults to 1 when not provided. */
  visitedAt: Date;
  isFirstTime: boolean;
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

// ─── GET all list projection ──────────────────────────────────────────────────

export interface GuestListItem {
  guestId: string;
  wasACouple: boolean;
  isFirstTime: boolean;
  nights: number;
  stayed: boolean;
  visitedDate: string;
  visitedAt: Date;
  didWeHangOut: boolean;
  // Solo fields (null when couple)
  fullName: string | null;
  countryCode: string | null;
  prefixCode: string | null;
  age: number | null;
  occupation: string[] | null;
  livingIn: string | null;
  birthplace: string | null;
  rating: number | null;
  gender: Gender | null;
  whatsapp: string | null;
  // Couple fields
  coupleInfo?: Array<{
    fullName: string;
    countryCode: string;
    prefixCode: string | null;
    age: number | null;
    occupation: string[];
    livingIn: string | null;
    birthplace: string | null;
    rating: number | null;
    gender: Gender;
    whatsapp: string | null;
  }>;
}

// ─── Pagination ───────────────────────────────────────────────────────────────

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
