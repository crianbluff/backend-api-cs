import {
  BirthdayCalendarItem,
  BirthdayUnusualItem,
  CountryConsecutive,
  MaxPeopleTogether,
  MaxPeopleTogetherItem,
  RankingGuest,
} from '../../types/stats-guests.types';

import { sortByVisitedDate } from './dates';

const DEFAULT_POSITIONS = [
  1, 25, 50, 75, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000, 1250, 1500, 1750, 2000,
] as const;

const UNUSUAL_BIRTHDAY_REASONS = new Map<string, string>([
  // Special dates
  ['1-1', "New Year's Day"],
  ['2-14', "Valentine's Day"],
  ['2-29', 'Leap Day'],
  ['10-31', 'Halloween'],
  ['12-24', 'Christmas Eve'],
  ['12-25', 'Christmas Day'],
  ['12-31', 'Last Day'],
  ['5-10', "Mother's Day"],

  // Special birthdays
  ['4-8', "Alo's Birthday"],
  ['7-3', "Cristian's Birthday"],
  ['10-11', "Blanca's Birthday"],
  ['10-15', "Ryan's Birthday"],

  // Independence days — Americas
  ['5-15', "Paraguay's Independence Day"],
  ['7-1', 'Canada Day'],
  ['7-4', 'United States Independence Day'],
  ['7-5', "Venezuela's Independence Day"],
  ['7-6', "Argentina's Independence Day"],
  ['7-20', "Colombia's Independence Day"],
  ['7-25', 'Puerto Rico Constitution Day'],
  ['7-26', "Cuba's National Rebellion Day"],
  ['8-1', "Jamaica's Independence Day"],
  ['8-6', "Bolivia's Independence Day"],
  ['8-10', "Ecuador's Independence Day"],
  ['8-15', "Panama's Independence Day"],
  ['8-17', "Dominican Republic's Restoration Day"],
  ['8-25', "Uruguay's Independence Day"],
  ['9-7', "Brazil's Independence Day"],
  ['9-15', "Central America's Independence Day"],
  ['9-16', "Mexico's Independence Day"],
  ['9-18', "Chile's Independence Day"],
  ['11-28', "Panama's Independence from Spain"],
]);

type GuestWithGroup = RankingGuest & {
  groupId?: string | null;
};

type GuestWithStay = GuestWithGroup & {
  visitedDate: string;
  nights: number;
};

type StayEvent<T> = {
  date: number;
  type: 'arrival' | 'departure';
  guest: T;
};

export function mapRankingGuest(guest: RankingGuest): RankingGuest {
  return {
    guestId: guest.guestId,
    fullName: guest.fullName,
    gender: guest.gender,
    groupId: guest.groupId,
    groupType: guest.groupType,
    hometownCode: guest.hometownCode,
    continent: guest.continent,
    region: guest.region,
    visitedDate: guest.visitedDate,
    birthDate: guest.birthDate,
  };
}

export function topAndBottom<T>(
  items: readonly T[],
  compare: (a: T, b: T) => number,
  limit = 5
): { highest: T[]; lowest: T[] } {
  if (limit <= 0 || items.length === 0) {
    return {
      highest: [],
      lowest: [],
    };
  }

  const sortedItems = [...items].sort(compare);

  return {
    highest: sortedItems.slice(0, limit),
    lowest: sortedItems.slice(-limit).reverse(),
  };
}

function getBirthdayKey(month: number, day: number): string {
  return `${month}-${day}`;
}

function getUnusualReason(month: number, day: number): string | null {
  return UNUSUAL_BIRTHDAY_REASONS.get(getBirthdayKey(month, day)) ?? null;
}

export function getUnusualBirthdays(calendar: readonly BirthdayCalendarItem[]): BirthdayUnusualItem[] {
  return calendar.flatMap((item) => {
    const reason = getUnusualReason(item.month, item.day);
    return reason ? [{ ...item, reason }] : [];
  });
}

export function getRepeatedBirthdays(calendar: readonly BirthdayCalendarItem[]): BirthdayCalendarItem[] {
  return [...calendar].filter(({ total }) => total > 1).sort(compareBirthdaysByFrequency);
}

function compareBirthdaysByFrequency(a: BirthdayCalendarItem, b: BirthdayCalendarItem): number {
  return b.total - a.total || a.month - b.month || a.day - b.day;
}

export function extractPositions<T extends RankingGuest>(
  items: readonly T[],
  positions: readonly number[] = DEFAULT_POSITIONS
): Array<{ position: number; guest: RankingGuest }> {
  const sortedGuests = [...items].sort(sortByVisitedDate);

  return positions.flatMap((position) => {
    const guest = sortedGuests[position - 1];
    return guest ? [{ position, guest: mapRankingGuest(guest) }] : [];
  });
}

export function getMostConsecutiveCountry<T extends RankingGuest>(
  guests: readonly T[],
  getCountry: (guest: T) => string | null | undefined,
  getVisitedDate: (guest: T) => string,
  getGroupId: (guest: T) => string | null | undefined
): CountryConsecutive | null {
  const uniqueGuests = getUniqueByGroup(guests, getGroupId);

  const sortedGuests = [...uniqueGuests].sort((a, b) => {
    const dateComparison = getVisitedDate(a).localeCompare(getVisitedDate(b));
    if (dateComparison !== 0) return dateComparison;
    return (getCountry(a) ?? '').localeCompare(getCountry(b) ?? '');
  });

  let currentCountry: string | null = null;
  let currentStreak = 0;
  let currentFirstVisit = '';
  let currentGuests: RankingGuest[] = [];

  let bestCountry: string | null = null;
  let bestStreak = 0;
  let bestFirstVisit = '';
  let bestLastVisit = '';
  let bestGuests: RankingGuest[] = [];

  for (const guest of sortedGuests) {
    const country = getCountry(guest);

    if (!country) continue;
    const visitedDate = getVisitedDate(guest);

    if (country === currentCountry) {
      currentStreak += 1;
      currentGuests.push(mapRankingGuest(guest));
    } else {
      currentCountry = country;
      currentStreak = 1;
      currentFirstVisit = visitedDate;
      currentGuests = [mapRankingGuest(guest)];
    }

    if (currentStreak > bestStreak) {
      bestCountry = country;
      bestStreak = currentStreak;
      bestFirstVisit = currentFirstVisit;
      bestLastVisit = visitedDate;
      bestGuests = [...currentGuests];
    }
  }

  if (!bestCountry) return null;

  return {
    code: bestCountry,
    streak: bestStreak,
    firstVisit: bestFirstVisit,
    lastVisit: bestLastVisit,
    guests: bestGuests,
  };
}

export function getMaxPeopleTogether<T extends GuestWithStay>(guests: readonly T[]): MaxPeopleTogether {
  const soloGuests = guests.filter(({ groupId }) => !groupId);

  return {
    solo: calculateMaxPeopleTogether(soloGuests),
    overall: calculateMaxPeopleTogether(guests),
  };
}

function calculateMaxPeopleTogether<T extends GuestWithStay>(guests: readonly T[]): MaxPeopleTogetherItem {
  const uniqueStays = getUniqueByGroup(guests, ({ groupId }) => groupId);
  const events = createStayEvents(uniqueStays);

  const activeGuests = new Map<string, T>();
  let maxGuests: T[] = [];

  for (const event of events) {
    const guestKey = getGuestKey(event.guest);

    if (event.type === 'arrival') {
      activeGuests.set(guestKey, event.guest);
      if (activeGuests.size > maxGuests.length) maxGuests = [...activeGuests.values()];
      continue;
    }

    activeGuests.delete(guestKey);
  }

  return {
    total: maxGuests.length,
    guests: maxGuests.map(mapRankingGuest),
  };
}

function createStayEvents<T extends GuestWithStay>(stays: readonly T[]): StayEvent<T>[] {
  return stays
    .flatMap((guest) => {
      const arrivalDate = new Date(guest.visitedDate);
      const departureDate = new Date(arrivalDate);

      departureDate.setDate(departureDate.getDate() + guest.nights);

      return [
        {
          date: arrivalDate.getTime(),
          type: 'arrival' as const,
          guest,
        },
        {
          date: departureDate.getTime(),
          type: 'departure' as const,
          guest,
        },
      ];
    })
    .sort(compareStayEvents);
}

function compareStayEvents<T>(a: StayEvent<T>, b: StayEvent<T>): number {
  if (a.date !== b.date) return a.date - b.date;
  if (a.type === b.type) return 0;

  // A departure frees the room before a new arrival at the same time.
  return a.type === 'departure' ? -1 : 1;
}

function getGuestKey<T extends GuestWithGroup>(guest: T): string {
  return guest.groupId ?? guest.guestId ?? guest.fullName;
}

function getUniqueByGroup<T>(items: readonly T[], getGroupId: (item: T) => string | null | undefined): T[] {
  const processedGroups = new Set<string>();

  return items.filter((item) => {
    const groupId = getGroupId(item);
    if (!groupId) return true;
    if (processedGroups.has(groupId)) return false;
    processedGroups.add(groupId);
    return true;
  });
}

export function getUniqueGroupGuests<T extends GuestWithGroup>(guests: readonly T[]): T[] {
  return getUniqueByGroup(guests, ({ groupId }) => groupId);
}
