import { Continent, Gender, GroupType, Region } from './global.types';

// -----------------------------------------------------------------------------
// Shared fields
// -----------------------------------------------------------------------------

export interface GuestIndividual {
  guestId: string;
  rating: number | null;

  hometownCode: string;
  countryCodeWeMet: string;
  livingInCode: string | null;
  prefixCode: string | null;

  continent: Continent;
  region: Region;

  fullName: string;
  hometown: string | null;
  livingIn: string | null;
  cityWeMet: string | null;
  locationWeMet: string | null;

  birthDate: string | null;
  occupation: string[];

  urlProfileCs: string | null;

  gender: Gender;
  isGay: boolean;

  whatsapp: string | null;
  instagram: string | null;
}

export interface VisitFields {
  nights: number;
  stayed: boolean;
  hangOut: boolean;
  visitedDate: string;

  isFirstTime: boolean;
  ambassador: boolean;
  didTheyReq: boolean;

  gift: string[] | null;
  comments: string | null;

  theirReference: string | null;
  myReference: string | null;
}

// -----------------------------------------------------------------------------
// MongoDB document
// -----------------------------------------------------------------------------

export interface GuestDocument extends GuestIndividual, VisitFields {
  groupId: string | null;
  groupType: GroupType;

  createdAt: Date;
  updatedAt: Date;
}

// -----------------------------------------------------------------------------
// GET all list items
// -----------------------------------------------------------------------------

export interface SoloListItem extends Pick<
  GuestIndividual,
  | 'guestId'
  | 'hometownCode'
  | 'countryCodeWeMet'
  | 'livingInCode'
  | 'prefixCode'
  | 'continent'
  | 'region'
  | 'fullName'
  | 'hometown'
  | 'livingIn'
  | 'cityWeMet'
  | 'locationWeMet'
  | 'birthDate'
  | 'occupation'
  | 'livingIn'
  | 'rating'
  | 'gender'
  | 'isGay'
  | 'whatsapp'
  | 'urlProfileCs'
> {
  groupType: 'solo';

  isFirstTime: boolean;
  ambassador: boolean;
  didTheyReq: boolean;

  nights: number;
  stayed: boolean;
  visitedDate: string;
  hangOut: boolean;

  theirReference: string | null;
  myReference: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface GroupMemberListItem extends Pick<
  GuestIndividual,
  | 'guestId'
  | 'hometownCode'
  | 'countryCodeWeMet'
  | 'livingInCode'
  | 'prefixCode'
  | 'continent'
  | 'region'
  | 'fullName'
  | 'hometown'
  | 'livingIn'
  | 'cityWeMet'
  | 'locationWeMet'
  | 'birthDate'
  | 'occupation'
  | 'livingIn'
  | 'rating'
  | 'gender'
  | 'isGay'
  | 'whatsapp'
  | 'instagram'
  | 'urlProfileCs'
> {
  hangOut: boolean;
  gift: string[] | null;
  comments: string | null;

  isFirstTime: boolean;
  ambassador: boolean;
  didTheyReq: boolean;

  theirReference: string | null;
  myReference: string | null;

  createdAt: Date;
  updatedAt: Date;
}

export interface GroupListItem {
  groupId: string;
  groupType: GroupType;

  nights: number;
  stayed: boolean;
  visitedDate: string;

  members: GroupMemberListItem[];

  createdAt: Date;
  updatedAt: Date;
}

export type GuestListItem = SoloListItem | GroupListItem;
