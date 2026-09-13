import { getUniqueGroupGuests, mapRankingGuest } from './stats';
import { buildStayRanking, buildTimeline } from './builders';

import {
  RankingGuest,
  StayArrivalItem,
  StayOverlapItem,
  StayRanking,
  TimelineArrivalItem,
  TimelineGuestItem,
  TimelineItem,
} from '../../types/stats-guests.types';

type TimelineDateFormat = 'year' | 'month' | 'day';

export type GuestStay = RankingGuest & {
  visitedDate: string;
  nights: number;
  groupId?: string | null;
};

type TimelineGuest = {
  visitedDate?: string;
  groupId?: string | null;
};

type IndexedStay<T extends GuestStay> = {
  guest: T;
  start: number;
  end: number;
};

const DEFAULT_LIMIT = 5;

function calendarDateToDayNumber(date: string): number {
  const [year, month, day] = date.split('-').map(Number);
  return Math.floor(Date.UTC(year, month - 1, day) / 86_400_000);
}

function formatCalendarDate(date: string): string {
  return date;
}

export function sortByVisitedDate(
  a: Pick<RankingGuest, 'visitedDate' | 'guestId'>,
  b: Pick<RankingGuest, 'visitedDate' | 'guestId'>
): number {
  const dateCompare = String(a.visitedDate ?? '').localeCompare(String(b.visitedDate ?? ''));
  if (dateCompare !== 0) return dateCompare;

  return String(a.guestId ?? '').localeCompare(String(b.guestId ?? ''));
}

export function sortByNights(direction: 'asc' | 'desc'): (a: GuestStay, b: GuestStay) => number {
  return (a, b) => {
    if (a.nights !== b.nights) return direction === 'desc' ? b.nights - a.nights : a.nights - b.nights;
    return sortByVisitedDate(a, b);
  };
}

function groupGuestsByType<T extends GuestStay>(guests: T[]) {
  const groups = {
    solo: [] as T[],
    friends: [] as T[],
    couple: [] as T[],
    family: [] as T[],
  };

  for (const guest of guests) {
    if (!guest.groupId) {
      groups.solo.push(guest);
      continue;
    }

    switch (guest.groupType) {
      case 'friends':
        groups.friends.push(guest);
        break;

      case 'couple':
        groups.couple.push(guest);
        break;

      case 'family':
        groups.family.push(guest);
        break;
    }
  }

  return groups;
}

function groupGuestsByArrival<T extends GuestStay>(guests: T[]): Map<string, RankingGuest[]> {
  const arrivals = new Map<string, RankingGuest[]>();

  for (const guest of getUniqueGroupGuests(guests)) {
    const mappedGuest = mapRankingGuest(guest);
    const dateKey = formatCalendarDate(guest.visitedDate);
    const existing = arrivals.get(dateKey);

    existing ? existing.push(mappedGuest) : arrivals.set(dateKey, [mappedGuest]);
  }

  return arrivals;
}

function buildArrivalRanking<T extends GuestStay>(guests: T[], limit = DEFAULT_LIMIT): TimelineArrivalItem[] {
  return [...groupGuestsByArrival(guests).entries()]
    .filter(([, guestsForDate]) => guestsForDate.length > 1)
    .map(([date, guestsForDate]) => ({
      date,
      total: guestsForDate.length,
      guests: guestsForDate,
    }))
    .sort((a, b) => {
      if (a.total !== b.total) return b.total - a.total;
      return a.date.localeCompare(b.date);
    })
    .slice(0, limit);
}

function getTimelineValue(guest: TimelineGuest, format: TimelineDateFormat): string | null {
  const { visitedDate } = guest;

  if (!visitedDate) return null;
  const year = visitedDate.slice(0, 4);

  switch (format) {
    case 'year':
      return year;

    case 'month':
      return visitedDate.slice(0, 7); // YYYY-MM

    case 'day': {
      const day = visitedDate.slice(8, 10);
      return `${year}-${day}`; // YYYY-DD
    }
  }
}

export function getTimeline<T extends TimelineGuest>(guests: T[], format: TimelineDateFormat): TimelineItem[] {
  return buildTimeline(
    guests,
    (guest) => getTimelineValue(guest, format),
    (guest) => guest.groupId
  );
}

export function getSameArrival<T extends GuestStay>(guests: T[]): StayArrivalItem[] {
  return buildArrivalRanking(guests);
}

function toIndexedStay<T extends GuestStay>(guest: T): IndexedStay<T> {
  const start = calendarDateToDayNumber(guest.visitedDate);

  return {
    guest,
    start,
    end: start + guest.nights,
  };
}

function toIndexedStays<T extends GuestStay>(guests: T[]): IndexedStay<T>[] {
  return guests.map(toIndexedStay).sort((a, b) => a.start - b.start);
}

function addOverlap<T>(overlaps: Map<T, T[]>, guest: T, overlappingGuest: T): void {
  const existing = overlaps.get(guest);
  existing ? existing.push(overlappingGuest) : overlaps.set(guest, [overlappingGuest]);
}

function findOverlappingStays<T extends GuestStay>(guests: T[]): Map<T, T[]> {
  const stays = toIndexedStays(guests);
  const overlapsByGuest = new Map<T, T[]>();
  const active: IndexedStay<T>[] = [];

  for (const current of stays) {
    for (let i = active.length - 1; i >= 0; i--) {
      if (active[i].end <= current.start) active.splice(i, 1);
    }

    for (const previous of active) {
      addOverlap(overlapsByGuest, current.guest, previous.guest);
      addOverlap(overlapsByGuest, previous.guest, current.guest);
    }

    active.push(current);
  }

  return overlapsByGuest;
}

export function getOverlappingStays<T extends GuestStay>(guests: T[]): StayOverlapItem[] {
  const stays = getUniqueGroupGuests(guests);
  const overlaps = findOverlappingStays(stays);

  return [...overlaps.entries()]
    .map(([, overlapping]) => ({
      total: overlapping.length,
      guests: overlapping.map(mapRankingGuest),
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, DEFAULT_LIMIT);
}

export function getSameStay<T extends GuestStay>(guests: T[]): TimelineGuestItem[] {
  const stays = getUniqueGroupGuests(guests);
  const overlaps = findOverlappingStays(stays);

  return [...overlaps.entries()]
    .map(([guest, overlapping]) => ({
      guest: mapRankingGuest(guest),
      overlap: overlapping.length,
      guests: overlapping.map(mapRankingGuest),
    }))
    .sort((a, b) => {
      if (a.overlap !== b.overlap) {
        return b.overlap - a.overlap;
      }

      return sortByVisitedDate(a.guest, b.guest);
    })
    .slice(0, DEFAULT_LIMIT);
}

export function getStays<T extends GuestStay>(guests: T[], direction: 'asc' | 'desc', limit = DEFAULT_LIMIT): StayRanking {
  const uniqueGuests = getUniqueGroupGuests(guests);
  const groupedGuests = groupGuestsByType(uniqueGuests);

  return {
    overall: buildStayRanking(uniqueGuests, direction, limit),
    solo: buildStayRanking(groupedGuests.solo, direction, limit),
    friends: buildStayRanking(groupedGuests.friends, direction, limit),
    couple: buildStayRanking(groupedGuests.couple, direction, limit),
    family: buildStayRanking(groupedGuests.family, direction, limit),
  };
}
