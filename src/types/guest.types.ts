export type Continent = 'africa' | 'america' | 'europe' | 'asia' | 'oceania';

export type Region =
  | 'north_america'
  | 'central_america'
  | 'south_america'
  | 'caribbean'
  | 'middle_east_asia'
  | 'southeast_asia'
  | 'eastern_asia'
  | 'south_asia'
  | 'central_asia'
  | 'west_europe'
  | 'scandinavia'
  | 'southern_europe'
  | 'northern_europe'
  | 'eastern_europe'
  | 'oceania'
  | 'africa';

export type Gender = 'male' | 'female' | 'trans';
export type GroupType = 'solo' | 'couple' | 'friends' | 'family';

// ─── Flat MongoDB document ────────────────────────────────────────────────────

export interface GuestDocument {
  guestId: string;
  groupId: string | null;
  groupType: GroupType | null;
  nights: number;
  stayed: boolean;
  hangOut: boolean;
  visitedDate: string;
  isFirstTime: boolean;
  gift: string[] | null;
  comments: string | null;
  rating: number | null;
  hometownCode: string;
  livingInCode: string | null;
  prefixCode: string | null;
  continent: Continent;
  region: Region;
  fullName: string;
  hometown: string | null;
  livingIn: string | null;
  birthDate: string | null;
  occupation: string[];
  urlProfileCs: string | null;
  gender: Gender;
  whatsapp: string | null;
  instagram: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// ─── GET all list items ───────────────────────────────────────────────────────

export interface SoloListItem {
  guestId: string;
  groupType: 'solo';
  isFirstTime: boolean;
  nights: number;
  stayed: boolean;
  visitedDate: string;
  hangOut: boolean;
  fullName: string;
  hometownCode: string;
  livingInCode: string | null;
  prefixCode: string | null;
  continent: Continent;
  region: Region;
  birthDate: string | null;
  occupation: string[];
  livingIn: string | null;
  hometown: string | null;
  rating: number | null;
  gender: Gender;
  whatsapp: string | null;
  urlProfileCs: string | null;
}

export interface GroupMemberListItem {
  guestId: string;
  isFirstTime: boolean;
  fullName: string;
  hometownCode: string;
  livingInCode: string | null;
  prefixCode: string | null;
  continent: Continent;
  region: Region;
  birthDate: string | null;
  occupation: string[];
  livingIn: string | null;
  hometown: string | null;
  rating: number | null;
  gender: Gender;
  whatsapp: string | null;
  urlProfileCs: string | null;
}

export interface GroupListItem {
  groupId: string;
  groupType: GroupType;
  nights: number;
  stayed: boolean;
  visitedDate: string;
  hangOut: boolean;
  gift: string[] | null;
  comments: string | null;
  members: GroupMemberListItem[];
}

export type GuestListItem = SoloListItem | GroupListItem;

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
