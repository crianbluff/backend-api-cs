export type Continent = 'Africa' | 'America' | 'Europe' | 'Asia' | 'Oceania';

export type Region =
  | 'North America'
  | 'Central America'
  | 'South America'
  | 'Caribbean'
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

export type Gender = 'male' | 'female' | 'trans';
export type GroupType = 'solo' | 'couple' | 'friends' | 'family';

export interface GuestDocument {
  guestId: string;
  groupId: string | null;
  groupType: GroupType;
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

export interface SoloListItem {
  guestId: string;
  groupId: null;
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
