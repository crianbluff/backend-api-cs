import { GuestLean } from '../../services/guest.service';
import { Continent } from '../../types/global.types';

import {
  CountryItem,
  GeographyItem,
  LocationItem,
  LocationRanking,
  RatingDistribution,
  RatingGuest,
  StayItem,
  TimelineItem,
} from '../../types/stats-guests.types';

import { GuestStay, sortByNights, sortByVisitedDate } from './dates';
import { mapRankingGuest, topAndBottom } from './stats';

const DEFAULT_LIMIT = 5;
const DEFAULT_TOP_LIMIT = 10;
const DEFAULT_BOTTOM_LIMIT = 10;
const DEFAULT_TIMELINE_LIMIT = 5;

type ParsedVisitedDate = {
  original: string;
  sortable: string;
};

type AggregatedCountry = {
  code: string;
  total: number;
  male: number;
  female: number;
  firstVisit: ParsedVisitedDate;
};

type AggregatedGeography = {
  code: string;
  total: number;
  firstVisit: ParsedVisitedDate;
};

type AggregatedLocation = {
  code: string | null;
  name: string | null;
  total: number;
};

/**
 * Supported date formats:
 *
 * YYYY
 * YYYY-MM
 * YYYY-MM-DD
 *
 * Examples:
 * 1988
 * 1995-02
 * 1995-05-25
 *
 * The original value is preserved for API output.
 * The sortable value is used only for chronological comparisons.
 */
function parseVisitedDate(value: string): ParsedVisitedDate {
  const parts = value.split('-');

  if (parts.length < 1 || parts.length > 3)
    throw new Error(`Invalid date format. Expected YYYY, YYYY-MM or YYYY-MM-DD, received: "${value}"`);
  const [year, month, day] = parts;

  if (!/^\d{4}$/.test(year)) throw new Error(`Invalid year. Expected YYYY, received: "${value}"`);
  if (parts.length >= 2 && !/^\d{2}$/.test(month)) throw new Error(`Invalid month. Expected YYYY-MM, received: "${value}"`);
  if (parts.length === 3 && !/^\d{2}$/.test(day)) throw new Error(`Invalid day. Expected YYYY-MM-DD, received: "${value}"`);

  if (month !== undefined) {
    const monthNumber = Number(month);
    if (monthNumber < 1 || monthNumber > 12) throw new Error(`Invalid month in date: "${value}"`);
  }

  if (day !== undefined && month !== undefined) {
    const dayNumber = Number(day);
    const monthNumber = Number(month);
    const yearNumber = Number(year);
    const daysInMonth = new Date(yearNumber, monthNumber, 0).getDate();

    if (dayNumber < 1 || dayNumber > daysInMonth) throw new Error(`Invalid day in date: "${value}"`);
  }

  return {
    original: value,
    sortable: [year, month ?? '00', day ?? '00'].join('-'),
  };
}

const compareVisitedDates = (a: ParsedVisitedDate, b: ParsedVisitedDate): number => {
  if (a.sortable === b.sortable) return 0;
  return a.sortable < b.sortable ? -1 : 1;
};

const compareByDateThenCode = <T extends { firstVisit: ParsedVisitedDate; code: string }>(a: T, b: T): number => {
  const dateCompare = compareVisitedDates(a.firstVisit, b.firstVisit);
  if (dateCompare !== 0) return dateCompare;
  return a.code.localeCompare(b.code);
};

const compareByTotal = <T extends { total: number; firstVisit: ParsedVisitedDate; code: string }>(a: T, b: T): number => {
  if (b.total !== a.total) return b.total - a.total;
  return compareByDateThenCode(a, b);
};

const compareByTotalThenName = (
  a: Pick<LocationItem, 'total' | 'name'>,
  b: Pick<LocationItem, 'total' | 'name'>
): number => {
  if (b.total !== a.total) return b.total - a.total;
  return (a.name ?? '').localeCompare(b.name ?? '');
};

export function buildCountries<T>(
  guests: T[],
  getCountry: (guest: T) => string | null | undefined,
  getGender: (guest: T) => string | null | undefined,
  getVisitedDate: (guest: T) => string,
  limitTop = DEFAULT_TOP_LIMIT,
  limitBottom = DEFAULT_BOTTOM_LIMIT
): {
  all: CountryItem[];
  top: CountryItem[];
  bottom: CountryItem[];
  topMale: CountryItem[];
  topFemale: CountryItem[];
} {
  const countries = new Map<string, AggregatedCountry>();

  for (const guest of guests) {
    const code = getCountry(guest);

    if (!code) continue;
    const visitedDate = parseVisitedDate(getVisitedDate(guest));
    const gender = getGender(guest);

    const country = countries.get(code) ?? {
      code,
      total: 0,
      male: 0,
      female: 0,
      firstVisit: visitedDate,
    };

    country.total++;

    if (gender === 'male') {
      country.male++;
    } else if (gender === 'female') {
      country.female++;
    }

    if (compareVisitedDates(visitedDate, country.firstVisit) < 0) country.firstVisit = visitedDate;
    countries.set(code, country);
  }

  const all = [...countries.values()].sort(compareByDateThenCode).map(toCountryItem);
  const sortedCountries = [...countries.values()].sort(compareByTotal);
  const top = sortedCountries.slice(0, limitTop).map(toCountryItem);
  const bottom = [...sortedCountries].reverse().slice(0, limitBottom).map(toCountryItem);

  const topMale = [...countries.values()]
    .filter(({ male }) => male > 0)
    .sort((a, b) => {
      if (b.male !== a.male) return b.male - a.male;
      return a.code.localeCompare(b.code);
    })
    .slice(0, DEFAULT_TOP_LIMIT)
    .map(toCountryItem);

  const topFemale = [...countries.values()]
    .filter(({ female }) => female > 0)
    .sort((a, b) => {
      if (b.female !== a.female) return b.female - a.female;
      return a.code.localeCompare(b.code);
    })
    .slice(0, DEFAULT_TOP_LIMIT)
    .map(toCountryItem);

  return {
    all,
    top,
    bottom,
    topMale,
    topFemale,
  };
}

function toCountryItem(country: AggregatedCountry): CountryItem {
  return {
    code: country.code,
    total: country.total,
    male: country.male,
    female: country.female,
    firstVisit: country.firstVisit.original,
  };
}

export function buildGeography<T>(
  guests: T[],
  getKey: (guest: T) => string | null | undefined,
  getVisitedDate: (guest: T) => string
): { all: GeographyItem[] };

export function buildGeography<T>(
  guests: T[],
  getKey: (guest: T) => string | null | undefined,
  getVisitedDate: (guest: T) => string,
  limitTop: number,
  limitBottom: number
): {
  all: GeographyItem[];
  top: GeographyItem[];
  bottom: GeographyItem[];
};

export function buildGeography<T>(
  guests: T[],
  getKey: (guest: T) => string | null | undefined,
  getVisitedDate: (guest: T) => string,
  limitTop?: number,
  limitBottom?: number
): {
  all: GeographyItem[];
  top?: GeographyItem[];
  bottom?: GeographyItem[];
} {
  const geography = new Map<string, AggregatedGeography>();

  for (const guest of guests) {
    const code = getKey(guest);

    if (!code) continue;
    const visitedDate = parseVisitedDate(getVisitedDate(guest));

    const item = geography.get(code) ?? {
      code,
      total: 0,
      firstVisit: visitedDate,
    };

    item.total++;

    if (compareVisitedDates(visitedDate, item.firstVisit) < 0) item.firstVisit = visitedDate;
    geography.set(code, item);
  }

  const all = [...geography.values()].sort(compareByDateThenCode).map(toGeographyItem);

  if (limitTop === undefined || limitBottom === undefined) return { all };
  const sortedGeography = [...geography.values()].sort(compareByTotal);

  return {
    all,
    top: sortedGeography.slice(0, limitTop).map(toGeographyItem),
    bottom: [...sortedGeography].reverse().slice(0, limitBottom).map(toGeographyItem),
  };
}

function toGeographyItem(geography: AggregatedGeography): GeographyItem {
  return {
    code: geography.code as Continent,
    total: geography.total,
    firstVisit: geography.firstVisit.original,
  };
}

export function buildLocations<T>(
  guests: T[],
  getCode: (guest: T) => string | null | undefined,
  getName: (guest: T) => string | null | undefined,
  limit = DEFAULT_TOP_LIMIT
): LocationRanking {
  const locations = new Map<string, AggregatedLocation>();

  for (const guest of guests) {
    const code = getCode(guest) ?? null;
    const name = getLocationName(getName(guest));

    if (!code && !name) continue;
    const key = `${code ?? ''}|${name ?? ''}`;

    const location = locations.get(key) ?? {
      code,
      name,
      total: 0,
    };

    location.total++;
    locations.set(key, location);
  }

  const top = [...locations.values()]
    .map<LocationItem>(({ code, name, total }) => ({
      code,
      name,
      total,
    }))
    .sort(compareByTotalThenName)
    .slice(0, limit);

  return { top };
}

function getLocationName(value: string | null | undefined): string | null {
  if (!value) return null;
  const parts = value.split(',');

  if (parts.length > 1) return parts[1].trim() || null;
  return value.trim() || null;
}

export function buildTimeline<T>(
  guests: T[],
  extractor: (guest: T) => string | null | undefined,
  getGroupId: (guest: T) => string | null | undefined
): TimelineItem[] {
  const timeline = new Map<string, number>();
  const processedGroups = new Set<string>();

  for (const guest of guests) {
    const groupId = getGroupId(guest);

    if (groupId) {
      if (processedGroups.has(groupId)) continue;
      processedGroups.add(groupId);
    }

    const period = extractor(guest);
    if (!period) continue;

    timeline.set(period, (timeline.get(period) ?? 0) + 1);
  }

  return [...timeline.entries()]
    .map(([period, total]) => ({
      period,
      total,
    }))
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total;
      return a.period.localeCompare(b.period);
    })
    .slice(0, DEFAULT_TIMELINE_LIMIT);
}

export function buildRatings(
  guests: GuestLean[],
  limit = DEFAULT_LIMIT
): {
  distribution: RatingDistribution;
  highest: RatingGuest[];
  lowest: RatingGuest[];
} {
  const distribution: RatingDistribution = {
    '1': 0,
    '2': 0,
    '3': 0,
    '4': 0,
    '5': 0,
    unrated: 0,
  };

  const ratedGuests: RatingGuest[] = [];

  for (const guest of guests) {
    if (guest.rating == null) {
      distribution.unrated++;
      continue;
    }

    const ratingKey = String(guest.rating) as keyof RatingDistribution;
    distribution[ratingKey]++;
    ratedGuests.push({ ...mapRankingGuest(guest), rating: guest.rating });
  }

  const { highest, lowest } = topAndBottom(
    ratedGuests,
    (a, b) => {
      if (b.rating !== a.rating) return b.rating - a.rating;
      return sortByVisitedDate(a, b);
    },
    limit
  );

  return {
    distribution,
    highest,
    lowest,
  };
}

function buildStayItems<T extends GuestStay>(guests: T[]): StayItem[] {
  return guests.map(({ nights, ...guest }) => ({
    guest: mapRankingGuest(guest as T),
    nights,
  }));
}

export function buildStayRanking<T extends GuestStay>(
  guests: T[],
  direction: 'asc' | 'desc',
  limit = DEFAULT_LIMIT
): StayItem[] {
  return buildStayItems([...guests].sort(sortByNights(direction)).slice(0, limit));
}
