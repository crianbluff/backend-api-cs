import { Model } from 'mongoose';
import { GuestModel, IGuestDocument } from '../models/guest.model';
import { Gender } from '../types/global.types';

import {
  BirthdayCalendarItem,
  BirthdayStats,
  GeographyStats,
  GiftItem,
  GiftStats,
  RatingsStats,
  StatsGuestsResponse,
  StaysStats,
  TimelineStats,
} from '../types/stats-guests.types';

import {
  extractPositions,
  getMaxPeopleTogether,
  getMostConsecutiveCountry,
  getRepeatedBirthdays,
  getUnusualBirthdays,
  mapRankingGuest,
} from '../utils/stats/stats';

import { buildCountries, buildGeography, buildLocations, buildRatings } from '../utils/stats/builders';

import {
  getSameArrival,
  getOverlappingStays,
  getTimeline,
  sortByVisitedDate,
  getSameStay,
  getStays,
} from '../utils/stats/dates';

type Guest = Awaited<ReturnType<StatsGuestService['loadGuests']>>[number];

const GROUP_TYPES = ['couple', 'friends', 'family'] as const;
const GROUP_RANKING_POSITIONS = [
  1, 10, 20, 30, 40, 50, 75, 100, 125, 150, 175, 200, 250, 300, 400, 500, 600, 700, 800, 900, 10000,
];

export class StatsGuestService {
  constructor(private readonly model: Model<IGuestDocument>) {}

  async getStats(): Promise<StatsGuestsResponse> {
    const guests = await this.loadGuests();

    return {
      summary: this.buildSummary(guests),
      rankings: this.buildRankings(guests),
      demographics: this.buildDemographics(guests),
      ratings: this.buildRatingsStats(guests),
      geography: this.buildGeographyStats(guests),
      gifts: this.buildGiftStats(guests),
      timeline: this.buildTimelineStats(guests),
      stays: this.buildStaysStats(guests),
      birthdays: this.buildBirthdayStats(guests),
    };
  }

  private async loadGuests() {
    return this.model
      .find()
      .sort({
        visitedDate: 1,
        guestId: 1,
      })
      .lean();
  }

  // Shared helpers
  private getSoloGuests(guests: Guest[]): Guest[] {
    return guests.filter((guest) => !guest.groupId);
  }

  private getGroupedGuests(guests: Guest[]): Guest[] {
    return guests.filter((guest) => !!guest.groupId);
  }

  private getGuestsByGroupType(guests: Guest[], groupType: (typeof GROUP_TYPES)[number]): Guest[] {
    return guests.filter((guest) => guest.groupId && guest.groupType === groupType);
  }

  private getVisitsAsOne(guests: Guest[]): Guest[] {
    const solo = this.getSoloGuests(guests);
    const groups = this.getGroupsAsOne(guests);

    return [...solo, ...groups].sort(sortByVisitedDate);
  }

  private getGroupsAsOne(guests: Guest[]): Guest[] {
    const groups = new Map<string, Guest[]>();

    for (const guest of guests) {
      if (!guest.groupId) continue;
      const members = groups.get(guest.groupId);
      members ? members.push(guest) : groups.set(guest.groupId, [guest]);
    }

    return Array.from(groups.values()).map((members) => [...members].sort(sortByVisitedDate)[0]);
  }

  private getAverage(values: number[]): number {
    if (!values.length) return 0;
    return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
  }

  private getNumericRatings(guests: Guest[]): number[] {
    return guests.map((guest) => guest.rating).filter((rating): rating is number => typeof rating === 'number');
  }

  private countGender(guests: Guest[]) {
    return {
      male: guests.filter((guest) => guest.gender === 'male').length,
      female: guests.filter((guest) => guest.gender === 'female').length,
      trans: guests.filter((guest) => guest.gender === 'trans').length,
      isGay: guests.filter((guest) => guest.isGay).length,
    };
  }

  private getMostVisitedGender(guests: Guest[]): Gender {
    const counts = this.countGender(guests);

    const result = Object.entries({
      male: counts.male,
      female: counts.female,
      trans: counts.trans,
    }).sort((a, b) => b[1] - a[1])[0];

    return result ? (result[0] as Gender) : 'male';
  }

  private getFirstLast(guests: Guest[]) {
    return {
      first: guests.length ? mapRankingGuest(guests[0]) : null,
      last: guests.length ? mapRankingGuest(guests[guests.length - 1]) : null,
    };
  }

  private getOldestYoungest(guests: Guest[], filter: (guest: Guest) => boolean, limit = 10) {
    const people = guests
      .filter(filter)
      .filter((guest) => guest.birthDate)
      .sort((a, b) => String(a.birthDate).localeCompare(String(b.birthDate)));

    return {
      oldest: people.slice(0, limit).map((guest) => mapRankingGuest(guest)),

      youngest: people
        .slice(-limit)
        .reverse()
        .map((guest) => mapRankingGuest(guest)),
    };
  }

  private buildSummary(guests: Guest[]) {
    const solo = this.getSoloGuests(guests);
    const groupsAsOne = this.getGroupsAsOne(guests);
    const visitsAsOne = this.getVisitsAsOne(guests);

    const groupedVisits = groupsAsOne.filter((guest) => !!guest.groupId);
    const totalNights = visitsAsOne.reduce((sum, guest) => sum + (guest.nights ?? 0), 0);

    const ratings = this.getNumericRatings(guests);
    const soloRatings = this.getNumericRatings(solo);
    const groupRatings = this.getNumericRatings(groupedVisits);

    const giftsReceived = visitsAsOne.filter((guest) => Array.isArray(guest.gift) && guest.gift.length > 0).length;

    return {
      totalGuests: guests.length,
      totalGuestsSolo: solo.length,
      totalGuestsGroups: new Set(guests.filter((guest) => guest.groupId).map((guest) => guest.groupId)).size,

      totalVisits: visitsAsOne.length,
      totalNights,

      averageNightsGeneral: this.getAverage(visitsAsOne.map((guest) => guest.nights ?? 0)),

      averageNightsSolo: this.getAverage(solo.map((guest) => guest.nights ?? 0)),

      averageNightsGroup: this.getAverage(groupedVisits.map((guest) => guest.nights ?? 0)),

      giftsReceived,
      guestsWithoutGift: visitsAsOne.length - giftsReceived,

      averageRatingGeneral: this.getAverage(ratings),
      averageRatingSolo: this.getAverage(soloRatings),
      averageRatingGroup: this.getAverage(groupRatings),
    };
  }

  private buildRankings(guests: Guest[]) {
    const solo = this.getSoloGuests(guests);
    const groupsAsOne = this.getGroupsAsOne(guests);

    const womenSolo = solo.filter((guest) => guest.gender === 'female');
    const womenOverall = guests.filter((guest) => guest.gender === 'female');

    const menSolo = solo.filter((guest) => guest.gender === 'male');
    const menOverall = guests.filter((guest) => guest.gender === 'male');

    const peopleOverall = [...guests].sort(sortByVisitedDate);

    const groups = {
      overall: groupsAsOne,
      couple: this.getGuestsByGroupType(groupsAsOne, 'couple'),
      friends: this.getGuestsByGroupType(groupsAsOne, 'friends'),
      family: this.getGuestsByGroupType(groupsAsOne, 'family'),
    };

    return {
      women: {
        solo: extractPositions(womenSolo),
        overall: extractPositions(womenOverall),
      },

      men: {
        solo: extractPositions(menSolo),
        overall: extractPositions(menOverall),
      },

      people: {
        solo: extractPositions(solo),
        overall: extractPositions(peopleOverall),
      },

      groups: {
        overall: extractPositions(groups.overall, GROUP_RANKING_POSITIONS),
        couple: extractPositions(groups.couple, GROUP_RANKING_POSITIONS),
        friends: extractPositions(groups.friends, GROUP_RANKING_POSITIONS),
        family: extractPositions(groups.family, GROUP_RANKING_POSITIONS),
      },
    };
  }

  private buildDemographics(guests: Guest[]) {
    const solo = this.getSoloGuests(guests);

    const grouped = this.getGroupedGuests(guests);

    const couple = this.getGuestsByGroupType(guests, 'couple');
    const friends = this.getGuestsByGroupType(guests, 'friends');
    const family = this.getGuestsByGroupType(guests, 'family');

    const groupsAsOne = this.getGroupsAsOne(guests);

    const coupleVisits = this.getGuestsByGroupType(groupsAsOne, 'couple');
    const friendsVisits = this.getGuestsByGroupType(groupsAsOne, 'friends');
    const familyVisits = this.getGuestsByGroupType(groupsAsOne, 'family');

    const overallAge = this.getOldestYoungest(guests, () => true, 10);
    const coupleAge = this.getOldestYoungest(guests, (guest) => !!guest.groupId && guest.groupType === 'couple', 3);

    const friendsAge = this.getOldestYoungest(guests, (guest) => !!guest.groupId && guest.groupType === 'friends', 3);
    const familyAge = this.getOldestYoungest(guests, (guest) => !!guest.groupId && guest.groupType === 'family', 3);
    const soloMaleAge = this.getOldestYoungest(guests, (guest) => !guest.groupId && guest.gender === 'male');
    const soloFemaleAge = this.getOldestYoungest(guests, (guest) => !guest.groupId && guest.gender === 'female');
    const soloTransAge = this.getOldestYoungest(guests, (guest) => !guest.groupId && guest.gender === 'trans');
    const soloGayAge = this.getOldestYoungest(guests, (guest) => guest.isGay);

    return {
      totals: {
        overall: this.countGender(guests),

        groups: {
          solo: this.countGender(solo),
          couple: this.countGender(couple),
          friends: this.countGender(friends),
          family: this.countGender(family),
        },
      },

      oldest: {
        solo: {
          male: soloMaleAge.oldest,
          female: soloFemaleAge.oldest,
          trans: soloTransAge.oldest,
          isGay: soloGayAge.oldest,
        },

        overall: {
          people: overallAge.oldest,
        },

        family: familyAge.oldest,
        friends: friendsAge.oldest,
        couple: coupleAge.oldest,
      },

      youngest: {
        solo: {
          male: soloMaleAge.youngest,
          female: soloFemaleAge.youngest,
          trans: soloTransAge.youngest,
          isGay: soloGayAge.youngest,
        },

        overall: {
          people: overallAge.youngest,
        },

        family: familyAge.youngest,
        friends: friendsAge.youngest,
        couple: coupleAge.youngest,
      },

      mostVisitedGender: {
        solo: this.getMostVisitedGender(solo),
        overall: this.getMostVisitedGender(guests),
        group: this.getMostVisitedGender(grouped),
        couple: this.getMostVisitedGender(couple),
        friends: this.getMostVisitedGender(friends),
        family: this.getMostVisitedGender(family),
      },

      firstLast: {
        overall: {
          people: this.getFirstLast(guests),
        },

        solo: {
          female: this.getFirstLast(solo.filter((guest) => guest.gender === 'female')),
          male: this.getFirstLast(solo.filter((guest) => guest.gender === 'male')),
          trans: this.getFirstLast(solo.filter((guest) => guest.gender === 'trans')),
          isGay: this.getFirstLast(solo.filter((guest) => guest.isGay)),
        },

        couple: this.getFirstLast(coupleVisits),
        friends: this.getFirstLast(friendsVisits),
        family: this.getFirstLast(familyVisits),
      },
    };
  }

  private buildRatingsStats(guests: Guest[]): RatingsStats {
    const solo = this.getSoloGuests(guests);
    const couple = this.getGuestsByGroupType(guests, 'couple');
    const friends = this.getGuestsByGroupType(guests, 'friends');
    const family = this.getGuestsByGroupType(guests, 'family');

    const overall = buildRatings(guests, 10);
    const soloRatings = buildRatings(solo);
    const coupleRatings = buildRatings(couple);
    const friendsRatings = buildRatings(friends);
    const familyRatings = buildRatings(family);

    return {
      distribution: {
        overall: overall.distribution,
        solo: soloRatings.distribution,
        couple: coupleRatings.distribution,
        friends: friendsRatings.distribution,
        family: familyRatings.distribution,
      },

      highest: {
        overall: overall.highest,
        solo: soloRatings.highest,
        couple: coupleRatings.highest,
        friends: friendsRatings.highest,
        family: familyRatings.highest,
      },

      lowest: {
        overall: overall.lowest,
        solo: soloRatings.lowest,
        couple: coupleRatings.lowest,
        friends: friendsRatings.lowest,
        family: familyRatings.lowest,
      },
    };
  }

  private buildGeographyStats(guests: Guest[]): GeographyStats {
    const continents = buildGeography(
      guests,
      (guest) => guest.continent,
      (guest) => guest.visitedDate
    );

    const regions = buildGeography(
      guests,
      (guest) => guest.region,
      (guest) => guest.visitedDate,
      5,
      5
    );

    const countries = buildCountries(
      guests,
      (guest) => guest.hometownCode,
      (guest) => guest.gender,
      (guest) => guest.visitedDate
    );

    const livingIn = buildLocations(
      guests,
      (guest) => guest.livingInCode,
      (guest) => guest.livingIn
    );

    const hometown = buildLocations(
      guests,
      (guest) => guest.hometownCode,
      (guest) => guest.hometown
    );

    const mostConsecutive = getMostConsecutiveCountry(
      guests,
      (guest) => guest.hometownCode,
      (guest) => guest.visitedDate,
      (guest) => guest.groupId
    );

    return {
      continents,
      regions,

      countries: {
        all: countries.all,
        top: countries.top,
        bottom: countries.bottom,
        topMale: countries.topMale,
        topFemale: countries.topFemale,
        mostConsecutive,
      },

      livingIn,
      hometown,
    };
  }

  private buildGiftStats(guests: Guest[]): GiftStats {
    const solo: GiftItem[] = [];
    const groups: GiftItem[] = [];

    const processedGroups = new Set<string>();

    for (const guest of guests) {
      const gifts = guest.gift ?? [];
      if (!gifts.length) continue;

      if (!guest.groupId) {
        solo.push({
          ...mapRankingGuest(guest),
          total: gifts.length,
          gifts,
        });

        continue;
      }

      if (processedGroups.has(guest.groupId)) continue;

      processedGroups.add(guest.groupId);

      groups.push({
        ...mapRankingGuest(guest),
        total: gifts.length,
        gifts,
      });
    }

    const sortGiftItems = (a: GiftItem, b: GiftItem) => {
      if (b.total !== a.total) return b.total - a.total;
      return sortByVisitedDate(a, b);
    };

    return {
      solo: solo.sort(sortGiftItems).slice(0, 5),
      groups: groups.sort(sortGiftItems).slice(0, 5),
    };
  }

  private buildTimelineStats(guests: Guest[]): TimelineStats {
    return {
      years: getTimeline(guests, 'year'),
      months: getTimeline(guests, 'month'),
      days: getTimeline(guests, 'day'),
      sameArrivalDay: getSameArrival(guests),
      sameStay: getSameStay(guests),
    };
  }

  private buildStaysStats(guests: Guest[]): StaysStats {
    return {
      longest: getStays(guests, 'desc'),
      shortest: getStays(guests, 'asc'),
      sameDates: getOverlappingStays(guests),
      sameArrival: getSameArrival(guests),
      maxPeopleTogether: getMaxPeopleTogether(guests),
    };
  }

  private buildBirthdayStats(guests: Guest[]): BirthdayStats {
    const calendar = this.buildBirthdayCalendar(guests);

    return {
      calendar,
      repeated: getRepeatedBirthdays(calendar),
      unusual: getUnusualBirthdays(calendar),
    };
  }

  private buildBirthdayCalendar(guests: Guest[]): BirthdayCalendarItem[] {
    const calendarMap = new Map<string, BirthdayCalendarItem>();

    for (const guest of guests) {
      if (!guest.birthDate) continue;
      const birthDate = String(guest.birthDate).trim();
      const fullDateMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthDate);

      // We intentionally ignore YYYY-MM and YYYY formats because
      // they don't contain enough information to determine a calendar day.
      if (!fullDateMatch) continue;

      const month = Number(fullDateMatch[2]);
      const day = Number(fullDateMatch[3]);
      if (month < 1 || month > 12 || day < 1 || day > 31) continue;

      const key = `${month}-${day}`;

      let item = calendarMap.get(key);

      if (!item) {
        item = {
          month,
          day,
          total: 0,
          guests: [],
        };

        calendarMap.set(key, item);
      }

      item.total++;
      item.guests.push(mapRankingGuest(guest));
    }

    return [...calendarMap.values()].sort((a, b) => {
      if (a.month !== b.month) return a.month - b.month;
      return a.day - b.day;
    });
  }
}

export const statsGuestService = new StatsGuestService(GuestModel);
