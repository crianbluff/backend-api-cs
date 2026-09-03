import { Model } from 'mongoose';
import { GuestModel, IGuestDocument } from '../models/guest.model';
import {
  CountryConsecutive,
  CountryItem,
  GeographyItem,
  GeographyStats,
  GiftItem,
  GiftStats,
  LocationItem,
  LocationRanking,
  MaxPeopleTogether,
  MaxPeopleTogetherItem,
  RankingGuest,
  RatingDistribution,
  RatingGuest,
  RatingsStats,
  StatsGuestsResponse,
  StayArrivalItem,
  StayItem,
  StayOverlapItem,
  StayRanking,
  StaysStats,
  TimelineArrivalItem,
  TimelineGuestItem,
  TimelineItem,
  TimelineStats,
} from '../types/stats-guests.types';
import { Continent, Gender } from '../types/guest.types';
import { GuestLean } from './guest.service';

export class StatsGuestService {
  constructor(private readonly model: Model<IGuestDocument>) {}

  async getStats(): Promise<StatsGuestsResponse> {
    const [summary, rankings, demographics, ratings, geography, gifts, timeline, stays] = await Promise.all([
      this.getSummary(),
      this.getRankings(),
      this.getDemographics(),
      this.getRatings(),
      this.getGeography(),
      this.getGifts(),
      this.getTimeline(),
      this.getStays(),
    ]);

    return {
      summary,
      rankings,
      demographics,
      ratings,
      geography,
      gifts,
      timeline,
      stays,
    };
  }

  private mapRankingGuest(guest: RankingGuest): RankingGuest {
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

  private sortByVisitedDate(a: any, b: any) {
    const dateCompare = String(a.visitedDate ?? '').localeCompare(String(b.visitedDate ?? ''));
    a.visitedDate.localeCompare(b.visitedDate);
    if (dateCompare !== 0) return dateCompare;

    return String(a.guestId ?? '').localeCompare(String(b.guestId ?? ''));
  }

  private extractPositions(
    items: any[],
    positions = [
      1, 25, 50, 75, 100, 150, 200, 250, 300, 350, 400, 450, 500, 600, 700, 800, 900, 1000, 1250, 1500, 1750, 2000,
    ]
  ) {
    const sorted = [...items].sort(this.sortByVisitedDate);

    return positions
      .filter((position) => sorted[position - 1])
      .map((position) => ({
        position,
        guest: this.mapRankingGuest(sorted[position - 1]),
      }));
  }

  private async getSummary() {
    const guests = await this.model.find().lean();
    const visitsMap = new Map<string, (typeof guests)[number]>();

    for (const guest of guests) {
      const key = guest.groupId ?? guest.guestId;
      if (!visitsMap.has(key)) {
        visitsMap.set(key, guest);
        continue;
      }

      const current = visitsMap.get(key)!;
      if (this.sortByVisitedDate(guest, current) < 0) {
        visitsMap.set(key, guest);
      }
    }

    const soloVisits = guests.filter((guest) => !guest.groupId);

    const groupVisits = Array.from(visitsMap.values()).filter((guest) => !!guest.groupId);
    const totalNightsSolo = soloVisits.reduce((sum, guest) => sum + (guest.nights ?? 0), 0);
    const totalNightsGroup = groupVisits.reduce((sum, guest) => sum + (guest.nights ?? 0), 0);
    const averageNightsSolo = soloVisits.length > 0 ? Number((totalNightsSolo / soloVisits.length).toFixed(2)) : 0;
    const averageNightsGroup = groupVisits.length > 0 ? Number((totalNightsGroup / groupVisits.length).toFixed(2)) : 0;

    const visits = Array.from(visitsMap.values());
    const totalGuests = guests.length;
    const totalGuestsSolo = guests.filter((guest) => !guest.groupId).length;
    const totalGuestsGroups = new Set(guests.filter((guest) => guest.groupId).map((guest) => guest.groupId)).size;
    const totalVisits = visits.length;
    const totalNights = visits.reduce((sum, guest) => sum + (guest.nights ?? 0), 0);
    const averageNightsGeneral = totalVisits > 0 ? Number((totalNights / totalVisits).toFixed(2)) : 0;
    const giftsReceived = visits.filter((guest) => Array.isArray(guest.gift) && guest.gift.length > 0).length;
    const guestsWithoutGift = totalVisits - giftsReceived;

    const ratings = guests.map((guest) => guest.rating).filter((rating): rating is number => typeof rating === 'number');

    const soloRatings = guests
      .filter((guest) => !guest.groupId)
      .map((guest) => guest.rating)
      .filter((rating): rating is number => typeof rating === 'number');

    const averageRatingSolo =
      soloRatings.length > 0
        ? Number((soloRatings.reduce((sum, rating) => sum + rating, 0) / soloRatings.length).toFixed(2))
        : 0;

    const groupRatings = visits
      .filter((guest) => !!guest.groupId)
      .map((guest) => guest.rating)
      .filter((rating): rating is number => typeof rating === 'number');

    const averageRatingGroup =
      groupRatings.length > 0
        ? Number((groupRatings.reduce((sum, rating) => sum + rating, 0) / groupRatings.length).toFixed(2))
        : 0;

    const averageRatingGeneral =
      ratings.length > 0 ? Number((ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(2)) : 0;

    return {
      totalGuests,
      totalGuestsSolo,
      totalGuestsGroups,
      totalVisits,
      totalNights,
      averageNightsGeneral,
      averageNightsSolo,
      averageNightsGroup,
      giftsReceived,
      guestsWithoutGift,
      averageRatingGeneral,
      averageRatingSolo,
      averageRatingGroup,
    };
  }

  private async getRankings() {
    const guests = await this.model.find().lean();

    // GROUPS AS ONE
    const groupMap = new Map<string, typeof guests>();

    for (const guest of guests) {
      if (!guest.groupId) continue;
      if (!groupMap.has(guest.groupId)) groupMap.set(guest.groupId, []);
      groupMap.get(guest.groupId)!.push(guest);
    }

    // Cada grupo cuenta como 1
    const groupsAsOne = Array.from(groupMap.values()).map((members) => [...members].sort(this.sortByVisitedDate)[0]);

    // GROUP TYPES
    const coupleGroups = groupsAsOne.filter((guest) => guest.groupType === 'couple');
    const friendsGroups = groupsAsOne.filter((guest) => guest.groupType === 'friends');
    const familyGroups = groupsAsOne.filter((guest) => guest.groupType === 'family');

    // PERSONAS SOLAS
    const peopleSolo = guests.filter((guest) => !guest.groupId);

    // WOMEN
    const womenSolo = peopleSolo.filter((guest) => guest.gender === 'female');

    // Todas las mujeres individualmente
    // solo + couple + friends + family
    const womenOverall = guests.filter((guest) => guest.gender === 'female');

    // MEN
    const menSolo = peopleSolo.filter((guest) => guest.gender === 'male');

    // Todos los hombres individualmente
    // solo + couple + friends + family
    const menOverall = guests.filter((guest) => guest.gender === 'male');

    // PEOPLE
    // Todas las personas individualmente
    const peopleOverall = [...guests].sort(this.sortByVisitedDate);

    return {
      women: {
        // Mujeres que fueron solas
        solo: this.extractPositions(womenSolo),

        // Todas las mujeres individualmente
        // sin importar si fueron solas o en grupo
        overall: this.extractPositions(womenOverall),
      },

      men: {
        // Hombres que fueron solos
        solo: this.extractPositions(menSolo),

        // Todos los hombres individualmente
        // sin importar si fueron solos o en grupo
        overall: this.extractPositions(menOverall),
      },

      people: {
        // Personas que fueron solas
        solo: this.extractPositions(peopleSolo),

        // Todas las personas individualmente
        overall: this.extractPositions(peopleOverall),
      },

      groups: {
        // Todos los grupos: couple + friends + family
        // Cada grupo cuenta como 1
        overall: this.extractPositions(
          groupsAsOne,
          [1, 10, 20, 30, 40, 50, 75, 100, 125, 150, 175, 200, 250, 300, 400, 500, 600, 700, 800, 900, 10000]
        ),

        // Cada grupo couple cuenta como 1
        couple: this.extractPositions(
          coupleGroups,
          [1, 10, 20, 30, 40, 50, 75, 100, 125, 150, 175, 200, 250, 300, 400, 500, 600, 700, 800, 900, 10000]
        ),

        // Cada grupo friends cuenta como 1
        friends: this.extractPositions(
          friendsGroups,
          [1, 10, 20, 30, 40, 50, 75, 100, 125, 150, 175, 200, 250, 300, 400, 500, 600, 700, 800, 900, 10000]
        ),

        // Cada grupo family cuenta como 1
        family: this.extractPositions(
          familyGroups,
          [1, 10, 20, 30, 40, 50, 75, 100, 125, 150, 175, 200, 250, 300, 400, 500, 600, 700, 800, 900, 10000]
        ),
      },
    };
  }

  private async getDemographics() {
    const guests = await this.model
      .find()
      .sort({
        visitedDate: 1,
        guestId: 1,
      })
      .lean();

    const solo = guests.filter((guest) => !guest.groupId);
    const groups = new Map<string, typeof guests>();

    for (const guest of guests) {
      if (!guest.groupId) continue;

      if (!groups.has(guest.groupId)) {
        groups.set(guest.groupId, []);
      }

      groups.get(guest.groupId)!.push(guest);
    }

    const groupVisits = Array.from(groups.values()).map((members) => [...members].sort(this.sortByVisitedDate)[0]);

    const countGender = (list: typeof guests) => ({
      male: list.filter((g) => g.gender === 'male').length,
      female: list.filter((g) => g.gender === 'female').length,
      trans: list.filter((g) => g.gender === 'trans').length,
      isGay: list.filter((g) => g.isGay).length,
    });

    const firstLast = (list: typeof guests) => ({
      first: list.length ? this.mapRankingGuest(list[0]) : null,
      last: list.length ? this.mapRankingGuest(list[list.length - 1]) : null,
    });

    const getMostVisitedGender = (list: typeof guests): Gender => {
      const counts = countGender(list);

      const result = Object.entries({
        male: counts.male,
        female: counts.female,
        trans: counts.trans,
      }).sort((a, b) => b[1] - a[1])[0];

      return result ? (result[0] as Gender) : 'male';
    };

    const groupOnly = guests.filter((g) => g.groupId);
    const coupleOnly = guests.filter((g) => g.groupId && g.groupType === 'couple');
    const friendsOnly = guests.filter((g) => g.groupId && g.groupType === 'friends');
    const familyOnly = guests.filter((g) => g.groupId && g.groupType === 'family');

    const oldestYoungestByFilter = (filter: (guest: (typeof guests)[number]) => boolean, limit = 10) => {
      const people = guests
        .filter(filter)
        .filter((guest) => guest.birthDate)
        .sort((a, b) => String(a.birthDate).localeCompare(String(b.birthDate)));

      return {
        oldest: people.slice(0, limit).map((guest) => this.mapRankingGuest(guest)),
        youngest: people
          .slice(-limit)
          .reverse()
          .map((guest) => this.mapRankingGuest(guest)),
      };
    };

    const overallAge = oldestYoungestByFilter(() => true, 10);

    const coupleAge = oldestYoungestByFilter((g) => !!g.groupId && g.groupType === 'couple', 3);
    const friendsAge = oldestYoungestByFilter((g) => !!g.groupId && g.groupType === 'friends', 3);
    const familyAge = oldestYoungestByFilter((g) => !!g.groupId && g.groupType === 'family', 3);

    const soloMaleAge = oldestYoungestByFilter((g) => !g.groupId && g.gender === 'male');
    const soloFemaleAge = oldestYoungestByFilter((g) => !g.groupId && g.gender === 'female');
    const soloTransAge = oldestYoungestByFilter((g) => !g.groupId && g.gender === 'trans');
    const soloGayAge = oldestYoungestByFilter((g) => !g.groupId && g.isGay);

    return {
      totals: {
        overall: countGender(guests),

        groups: {
          solo: countGender(solo),
          couple: countGender(guests.filter((g) => g.groupId && g.groupType === 'couple')),
          friends: countGender(guests.filter((g) => g.groupId && g.groupType === 'friends')),
          family: countGender(guests.filter((g) => g.groupId && g.groupType === 'family')),
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
        solo: getMostVisitedGender(solo),
        overall: getMostVisitedGender(guests),
        group: getMostVisitedGender(groupOnly),
        couple: getMostVisitedGender(coupleOnly),
        friends: getMostVisitedGender(friendsOnly),
        family: getMostVisitedGender(familyOnly),
      },

      firstLast: {
        overall: {
          people: firstLast(guests),
        },
        solo: {
          female: firstLast(solo.filter((g) => g.gender === 'female')),
          male: firstLast(solo.filter((g) => g.gender === 'male')),
          trans: firstLast(solo.filter((g) => g.gender === 'trans')),
          isGay: firstLast(solo.filter((g) => g.isGay)),
        },
        couple: firstLast(groupVisits.filter((g) => g.groupType === 'couple')),
        friends: firstLast(groupVisits.filter((g) => g.groupType === 'friends')),
        family: firstLast(groupVisits.filter((g) => g.groupType === 'family')),
      },
    };
  }

  private topAndBottom<T>(items: T[], compare: (a: T, b: T) => number, limit = 5): { highest: T[]; lowest: T[] } {
    return {
      highest: [...items].sort(compare).slice(0, limit),
      lowest: [...items].sort((a, b) => compare(b, a)).slice(0, limit),
    };
  }

  private buildRatings(guests: GuestLean[], limit = 5) {
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

      distribution[String(guest.rating) as keyof RatingDistribution]++;

      ratedGuests.push({
        ...this.mapRankingGuest(guest),
        rating: guest.rating,
      });
    }

    const { highest, lowest } = this.topAndBottom(
      ratedGuests,
      (a, b) => {
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }

        return this.sortByVisitedDate(a, b);
      },
      limit
    );

    return {
      distribution,
      highest,
      lowest,
    };
  }

  private async getRatings(): Promise<RatingsStats> {
    const guests = await this.model.find().lean();

    const solo = guests.filter((g) => !g.groupId);

    const couple = guests.filter((g) => g.groupId && g.groupType === 'couple');

    const friends = guests.filter((g) => g.groupId && g.groupType === 'friends');

    const family = guests.filter((g) => g.groupId && g.groupType === 'family');

    const overall = this.buildRatings(guests, 10);
    const soloRatings = this.buildRatings(solo);
    const coupleRatings = this.buildRatings(couple);
    const friendsRatings = this.buildRatings(friends);
    const familyRatings = this.buildRatings(family);

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

  private buildCountries<T>(
    guests: T[],
    getCountry: (guest: T) => string | null | undefined,
    getGender: (guest: T) => string | null | undefined,
    getVisitedDate: (guest: T) => string,
    getGroupId: (guest: T) => string | null | undefined,
    limitTop = 5,
    limitBottom = 5
  ): {
    all: CountryItem[];
    top: CountryItem[];
    bottom: CountryItem[];
    topMale: CountryItem[];
    topFemale: CountryItem[];
  } {
    const map = new Map<
      string,
      {
        code: string;
        total: number;
        male: number;
        female: number;
        firstVisit: string;
        groups: Set<string>;
      }
    >();

    for (const guest of guests) {
      const country = getCountry(guest);

      if (!country) continue;

      const visitedDate = getVisitedDate(guest);
      const gender = getGender(guest);
      const groupId = getGroupId(guest);

      let item = map.get(country);

      if (!item) {
        item = {
          code: country,
          total: 0,
          male: 0,
          female: 0,
          firstVisit: visitedDate,
          groups: new Set(),
        };

        map.set(country, item);
      }

      if (visitedDate.localeCompare(item.firstVisit) < 0) {
        item.firstVisit = visitedDate;
      }

      // Contar grupo como 1
      if (groupId) {
        if (item.groups.has(groupId)) {
          continue;
        }

        item.groups.add(groupId);
      }

      item.total++;

      if (gender === 'male') {
        item.male++;
      }

      if (gender === 'female') {
        item.female++;
      }
    }

    const all = [...map.values()]
      .map<CountryItem>((item) => ({
        code: item.code,
        total: item.total,
        male: item.male,
        female: item.female,
        firstVisit: item.firstVisit,
      }))
      .sort((a, b) => {
        const dateCompare = a.firstVisit.localeCompare(b.firstVisit);

        if (dateCompare !== 0) {
          return dateCompare;
        }

        return a.code.localeCompare(b.code);
      });

    const byTotal = [...all].sort((a, b) => {
      if (b.total !== a.total) {
        return b.total - a.total;
      }

      const dateCompare = a.firstVisit.localeCompare(b.firstVisit);

      if (dateCompare !== 0) {
        return dateCompare;
      }

      return a.code.localeCompare(b.code);
    });

    const topMale = [...all]
      .filter((country) => country.male > 0)
      .sort((a, b) => {
        if (b.male !== a.male) {
          return b.male - a.male;
        }

        return a.code.localeCompare(b.code);
      })
      .slice(0, 10);

    const topFemale = [...all]
      .filter((country) => country.female > 0)
      .sort((a, b) => {
        if (b.female !== a.female) {
          return b.female - a.female;
        }

        return a.code.localeCompare(b.code);
      })
      .slice(0, 10);

    return {
      all,
      top: byTotal.slice(0, limitTop),
      bottom: [...byTotal].reverse().slice(0, limitBottom),
      topMale,
      topFemale,
    };
  }

  private buildGeography<T>(
    guests: T[],
    getKey: (guest: T) => string | null | undefined,
    getVisitedDate: (guest: T) => string,
    getGroupId: (guest: T) => string | null | undefined,
    limitTop = 5,
    limitBottom = 5
  ): {
    all: GeographyItem[];
    top: GeographyItem[];
    bottom: GeographyItem[];
  } {
    const map = new Map<
      string,
      {
        code: string;
        total: number;
        firstVisit: string;
        groups: Set<string>;
      }
    >();

    for (const guest of guests) {
      const code = getKey(guest);

      if (!code) continue;

      const visitedDate = getVisitedDate(guest);
      const groupId = getGroupId(guest);

      let item = map.get(code);

      if (!item) {
        item = {
          code,
          total: 0,
          firstVisit: visitedDate,
          groups: new Set(),
        };

        map.set(code, item);
      }

      if (visitedDate.localeCompare(item.firstVisit) < 0) {
        item.firstVisit = visitedDate;
      }

      // contar grupo como 1
      if (groupId) {
        if (item.groups.has(groupId)) continue;

        item.groups.add(groupId);
      }

      item.total++;
    }

    const all = [...map.values()]
      .map((item) => ({
        code: item.code as Continent,
        total: item.total,
        firstVisit: item.firstVisit,
      }))
      .sort((a, b) => {
        const dateCompare = a.firstVisit.localeCompare(b.firstVisit);

        if (dateCompare !== 0) {
          return dateCompare;
        }

        return a.code.localeCompare(b.code);
      });

    const byTotal = [...all].sort((a, b) => {
      if (b.total !== a.total) {
        return b.total - a.total;
      }

      const dateCompare = a.firstVisit.localeCompare(b.firstVisit);

      if (dateCompare !== 0) {
        return dateCompare;
      }

      return a.code.localeCompare(b.code);
    });

    return {
      all,
      top: byTotal.slice(0, limitTop),
      bottom: [...byTotal].reverse().slice(0, limitBottom),
    };
  }

  private buildLocations<T>(
    guests: T[],
    getCode: (guest: T) => string | null | undefined,
    getName: (guest: T) => string | null | undefined,
    getGroupId: (guest: T) => string | null | undefined,
    limit = 5
  ): LocationRanking {
    const map = new Map<
      string,
      {
        code: string | null;
        name: string | null;
        total: number;
        groups: Set<string>;
      }
    >();

    for (const guest of guests) {
      const code = getCode(guest);
      const name = getName(guest);

      if (!code && !name) continue;

      const key = `${code ?? ''}|${name ?? ''}`;
      const groupId = getGroupId(guest);

      let item = map.get(key);

      if (!item) {
        item = {
          code: code ?? null,
          name: name ?? null,
          total: 0,
          groups: new Set(),
        };

        map.set(key, item);
      }

      // contar grupos como 1
      if (groupId) {
        if (item.groups.has(groupId)) continue;

        item.groups.add(groupId);
      }

      item.total++;
    }

    const top = [...map.values()]
      .map<LocationItem>((item) => ({
        code: item.code,
        name: item.name,
        total: item.total,
      }))
      .sort((a, b) => {
        if (b.total !== a.total) {
          return b.total - a.total;
        }

        return (a.name ?? '').localeCompare(b.name ?? '');
      })
      .slice(0, limit);

    return { top };
  }

  private getMostConsecutiveCountry<T extends RankingGuest>(
    guests: T[],
    getCountry: (guest: T) => string | null | undefined,
    getVisitedDate: (guest: T) => string,
    getGroupId: (guest: T) => string | null | undefined
  ): CountryConsecutive | null {
    const uniqueGuests: T[] = [];
    const processedGroups = new Set<string>();

    // Contar grupos como 1
    for (const guest of guests) {
      const groupId = getGroupId(guest);

      if (groupId) {
        if (processedGroups.has(groupId)) continue;
        processedGroups.add(groupId);
      }

      uniqueGuests.push(guest);
    }

    // Orden cronológico
    uniqueGuests.sort((a, b) => {
      const dateCompare = getVisitedDate(a).localeCompare(getVisitedDate(b));

      if (dateCompare !== 0) {
        return dateCompare;
      }

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

    for (const guest of uniqueGuests) {
      const country = getCountry(guest);

      if (!country) continue;

      const visitedDate = getVisitedDate(guest);

      if (country === currentCountry) {
        currentStreak++;
        currentGuests.push(this.mapRankingGuest(guest));
      } else {
        currentCountry = country;
        currentStreak = 1;
        currentFirstVisit = visitedDate;
        currentGuests = [this.mapRankingGuest(guest)];
      }

      if (currentStreak > bestStreak) {
        bestCountry = currentCountry;
        bestStreak = currentStreak;
        bestFirstVisit = currentFirstVisit;
        bestLastVisit = visitedDate;
        bestGuests = [...currentGuests];
      }
    }

    if (!bestCountry) {
      return null;
    }

    return {
      code: bestCountry,
      streak: bestStreak,
      firstVisit: bestFirstVisit,
      lastVisit: bestLastVisit,
      guests: bestGuests,
    };
  }

  private async getGeography(): Promise<GeographyStats> {
    const guests = await this.model.find().lean();

    const continents = this.buildGeography(
      guests,
      (g) => g.continent,
      (g) => g.visitedDate,
      (g) => g.groupId,
      2,
      2
    );

    const regions = this.buildGeography(
      guests,
      (g) => g.region,
      (g) => g.visitedDate,
      (g) => g.groupId,
      5,
      5
    );

    const countries = this.buildCountries(
      guests,
      (g) => g.hometownCode,
      (g) => g.gender,
      (g) => g.visitedDate,
      (g) => g.groupId,
      10,
      10
    );

    const livingIn = this.buildLocations(
      guests,
      (g) => g.livingInCode,
      (g) => g.livingIn,
      (g) => g.groupId
    );

    const hometown = this.buildLocations(
      guests,
      (g) => g.hometownCode,
      (g) => g.hometown,
      (g) => g.groupId
    );

    const mostConsecutive = this.getMostConsecutiveCountry(
      guests,
      (g) => g.hometownCode,
      (g) => g.visitedDate,
      (g) => g.groupId
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

  private async getGifts(): Promise<GiftStats> {
    const guests = await this.model.find().lean();

    const solo: GiftItem[] = [];
    const groups: GiftItem[] = [];

    const processedGroups = new Set<string>();

    for (const guest of guests) {
      const gifts = guest.gift ?? [];

      if (!gifts.length) {
        continue;
      }

      if (!guest.groupId) {
        solo.push({
          ...this.mapRankingGuest(guest),
          total: gifts.length,
          gifts,
        });

        continue;
      }

      if (processedGroups.has(guest.groupId)) {
        continue;
      }

      processedGroups.add(guest.groupId);

      groups.push({
        ...this.mapRankingGuest(guest),
        total: gifts.length,
        gifts,
      });
    }

    solo.sort((a, b) => {
      if (b.total !== a.total) {
        return b.total - a.total;
      }

      return this.sortByVisitedDate(a, b);
    });

    groups.sort((a, b) => {
      if (b.total !== a.total) {
        return b.total - a.total;
      }

      return this.sortByVisitedDate(a, b);
    });

    return {
      solo: solo.slice(0, 5),
      groups: groups.slice(0, 5),
    };
  }

  private buildTimeline<T>(
    guests: T[],
    extractor: (guest: T) => string | null | undefined,
    getGroupId: (guest: T) => string | null | undefined
  ): TimelineItem[] {
    const map = new Map<string, number>();
    const processedGroups = new Set<string>();

    for (const guest of guests) {
      const groupId = getGroupId(guest);

      if (groupId) {
        if (processedGroups.has(groupId)) {
          continue;
        }

        processedGroups.add(groupId);
      }

      const value = extractor(guest);

      if (!value) {
        continue;
      }

      map.set(value, (map.get(value) ?? 0) + 1);
    }

    return [...map.entries()]
      .map(([period, total]) => ({
        period,
        total,
      }))
      .sort((a, b) => {
        if (b.total !== a.total) {
          return b.total - a.total;
        }

        return a.period.localeCompare(b.period);
      })
      .slice(0, 5);
  }

  private getTimelineYears<T extends { visitedDate?: string; groupId?: string | null }>(guests: T[]): TimelineItem[] {
    return this.buildTimeline(
      guests,
      (guest) => guest.visitedDate?.substring(0, 4),
      (guest) => guest.groupId
    );
  }

  private getTimelineMonths<T extends { visitedDate?: string; groupId?: string | null }>(guests: T[]): TimelineItem[] {
    return this.buildTimeline(
      guests,
      (guest) => {
        if (!guest.visitedDate) {
          return null;
        }

        const date = new Date(guest.visitedDate);

        return date.toLocaleString('en', {
          month: 'long',
        });
      },
      (guest) => guest.groupId
    );
  }

  private getTimelineDays<T extends { visitedDate?: string; groupId?: string | null }>(guests: T[]): TimelineItem[] {
    return this.buildTimeline(
      guests,
      (guest) => {
        if (!guest.visitedDate) {
          return null;
        }

        return String(new Date(guest.visitedDate).getDate());
      },
      (guest) => guest.groupId
    );
  }

  private getSameArrivalDay<
    T extends RankingGuest & {
      visitedDate: string;
      groupId?: string | null;
    },
  >(guests: T[]): TimelineArrivalItem[] {
    const processedGroups = new Set<string>();
    const arrivals = new Map<string, RankingGuest[]>();

    for (const guest of guests) {
      if (guest.groupId) {
        if (processedGroups.has(guest.groupId)) {
          continue;
        }

        processedGroups.add(guest.groupId);
      }

      const date = guest.visitedDate;

      if (!arrivals.has(date)) {
        arrivals.set(date, []);
      }

      arrivals.get(date)!.push(this.mapRankingGuest(guest));
    }

    return [...arrivals.entries()]
      .filter(([, guests]) => guests.length > 1)
      .map(([date, guests]) => ({
        date,
        total: guests.length,
        guests,
      }))
      .sort((a, b) => {
        if (b.total !== a.total) {
          return b.total - a.total;
        }

        return a.date.localeCompare(b.date);
      })
      .slice(0, 5);
  }

  private getSameStay<
    T extends RankingGuest & {
      visitedDate: string;
      nights: number;
      groupId?: string | null;
    },
  >(guests: T[]): TimelineGuestItem[] {
    const processedGroups = new Set<string>();
    const stays: T[] = [];

    // Contar grupos como una sola estancia
    for (const guest of guests) {
      if (guest.groupId) {
        if (processedGroups.has(guest.groupId)) {
          continue;
        }

        processedGroups.add(guest.groupId);
      }

      stays.push(guest);
    }

    const results: TimelineGuestItem[] = [];

    for (const current of stays) {
      const currentStart = new Date(current.visitedDate);
      const currentEnd = new Date(current.visitedDate);
      currentEnd.setDate(currentEnd.getDate() + current.nights);

      const overlaps: RankingGuest[] = [];

      for (const other of stays) {
        if (current === other) {
          continue;
        }

        const otherStart = new Date(other.visitedDate);
        const otherEnd = new Date(other.visitedDate);
        otherEnd.setDate(otherEnd.getDate() + other.nights);

        const overlap = currentStart < otherEnd && otherStart < currentEnd;

        if (overlap) {
          overlaps.push(this.mapRankingGuest(other));
        }
      }

      if (overlaps.length === 0) {
        continue;
      }

      results.push({
        guest: this.mapRankingGuest(current),
        overlap: overlaps.length,
        guests: overlaps,
      });
    }

    return results
      .sort((a, b) => (b.overlap !== a.overlap ? b.overlap - a.overlap : this.sortByVisitedDate(a.guest, b.guest)))
      .slice(0, 5);
  }

  private async getTimeline(): Promise<TimelineStats> {
    const guests = await this.model.find().lean();

    return {
      years: this.getTimelineYears(guests),
      months: this.getTimelineMonths(guests),
      days: this.getTimelineDays(guests),
      sameArrivalDay: this.getSameArrivalDay(guests),
      sameStay: this.getSameStay(guests),
    };
  }

  private getLongestStays<
    T extends RankingGuest & {
      nights: number;
      groupId?: string | null;
      groupType?: string | null;
    },
  >(guests: T[]): StayRanking {
    const buildRanking = (items: T[], limit = 5): StayItem[] => {
      return [...items]
        .map((guest) => ({
          guest: this.mapRankingGuest(guest),
          nights: guest.nights,
        }))
        .sort((a, b) => {
          if (b.nights !== a.nights) {
            return b.nights - a.nights;
          }

          return this.sortByVisitedDate(a.guest, b.guest);
        })
        .slice(0, limit);
    };

    const processedGroups = new Set<string>();

    const overall: T[] = [];
    const solo: T[] = [];
    const friends: T[] = [];
    const couple: T[] = [];
    const family: T[] = [];

    for (const guest of guests) {
      // SOLO
      if (!guest.groupId) {
        solo.push(guest);
        overall.push(guest);
        continue;
      }

      // Evitar repetir miembros del mismo grupo
      if (processedGroups.has(guest.groupId)) {
        continue;
      }

      processedGroups.add(guest.groupId);

      // El grupo cuenta como 1 en overall
      overall.push(guest);

      // Clasificar por tipo
      switch (guest.groupType) {
        case 'friends':
          friends.push(guest);
          break;

        case 'couple':
          couple.push(guest);
          break;

        case 'family':
          family.push(guest);
          break;
      }
    }

    return {
      solo: buildRanking(solo),
      overall: buildRanking(overall),
      friends: buildRanking(friends),
      couple: buildRanking(couple),
      family: buildRanking(family),
    };
  }

  private getShortestStays<
    T extends RankingGuest & {
      nights: number;
      groupId?: string | null;
      groupType?: string | null;
    },
  >(guests: T[]): StayRanking {
    const buildRanking = (items: T[], limit = 5): StayItem[] => {
      return [...items]
        .map((guest) => ({
          guest: this.mapRankingGuest(guest),
          nights: guest.nights,
        }))
        .sort((a, b) => {
          if (a.nights !== b.nights) {
            return a.nights - b.nights;
          }

          return this.sortByVisitedDate(a.guest, b.guest);
        })
        .slice(0, limit);
    };

    const processedGroups = new Set<string>();

    const overall: T[] = [];
    const solo: T[] = [];
    const friends: T[] = [];
    const couple: T[] = [];
    const family: T[] = [];

    for (const guest of guests) {
      // SOLO
      if (!guest.groupId) {
        solo.push(guest);
        overall.push(guest);
        continue;
      }

      // Evitar repetir miembros del mismo grupo
      if (processedGroups.has(guest.groupId)) {
        continue;
      }

      processedGroups.add(guest.groupId);

      // El grupo cuenta como 1 en overall
      overall.push(guest);

      switch (guest.groupType) {
        case 'friends':
          friends.push(guest);
          break;

        case 'couple':
          couple.push(guest);
          break;

        case 'family':
          family.push(guest);
          break;
      }
    }

    return {
      solo: buildRanking(solo),
      overall: buildRanking(overall),
      friends: buildRanking(friends),
      couple: buildRanking(couple),
      family: buildRanking(family),
    };
  }

  private getSameDates<
    T extends RankingGuest & {
      visitedDate: string;
      nights: number;
      groupId?: string | null;
    },
  >(guests: T[]): StayOverlapItem[] {
    const processedGroups = new Set<string>();
    const stays: T[] = [];

    // Los grupos cuentan como una sola estancia
    for (const guest of guests) {
      if (guest.groupId) {
        if (processedGroups.has(guest.groupId)) {
          continue;
        }

        processedGroups.add(guest.groupId);
      }

      stays.push(guest);
    }

    const combinations = new Map<string, RankingGuest[]>();

    for (let i = 0; i < stays.length; i++) {
      const current = stays[i];

      const currentStart = new Date(current.visitedDate);
      const currentEnd = new Date(current.visitedDate);

      currentEnd.setDate(currentEnd.getDate() + current.nights);

      const overlapping: T[] = [];

      for (let j = 0; j < stays.length; j++) {
        if (i === j) {
          continue;
        }

        const other = stays[j];

        const otherStart = new Date(other.visitedDate);
        const otherEnd = new Date(other.visitedDate);

        otherEnd.setDate(otherEnd.getDate() + other.nights);

        const overlaps = currentStart < otherEnd && otherStart < currentEnd;

        if (overlaps) {
          overlapping.push(other);
        }
      }

      if (!overlapping.length) {
        continue;
      }

      const combination = [current, ...overlapping];

      const combinationKey = combination
        .map((guest) => guest.guestId ?? guest.fullName)
        .sort()
        .join('|');

      if (combinations.has(combinationKey)) {
        continue;
      }

      combinations.set(
        combinationKey,
        combination.map((guest) => this.mapRankingGuest(guest))
      );
    }

    return [...combinations.values()]
      .map((guests) => ({
        total: guests.length,
        guests,
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }

  private getSameArrival<
    T extends RankingGuest & {
      visitedDate: string;
      groupId?: string | null;
    },
  >(guests: T[]): StayArrivalItem[] {
    const processedGroups = new Set<string>();
    const arrivals = new Map<string, RankingGuest[]>();

    for (const guest of guests) {
      if (guest.groupId) {
        if (processedGroups.has(guest.groupId)) {
          continue;
        }

        processedGroups.add(guest.groupId);
      }

      const date = guest.visitedDate;

      if (!arrivals.has(date)) {
        arrivals.set(date, []);
      }

      arrivals.get(date)!.push(this.mapRankingGuest(guest));
    }

    return [...arrivals.entries()]
      .filter(([, guests]) => guests.length > 1)
      .map(([date, guests]) => ({
        date,
        total: guests.length,
        guests,
      }))
      .sort((a, b) => {
        if (b.total !== a.total) {
          return b.total - a.total;
        }

        return a.date.localeCompare(b.date);
      })
      .slice(0, 5);
  }

  private getMaxPeopleTogether<
    T extends RankingGuest & {
      visitedDate: string;
      nights: number;
      groupId?: string | null;
    },
  >(guests: T[]): MaxPeopleTogether {
    const calculate = (items: T[]): MaxPeopleTogetherItem => {
      const processedGroups = new Set<string>();

      const stays: T[] = [];

      // Construir las estancias únicas
      for (const guest of items) {
        if (guest.groupId) {
          if (processedGroups.has(guest.groupId)) {
            continue;
          }

          processedGroups.add(guest.groupId);
        }

        stays.push(guest);
      }

      const events: {
        date: number;
        type: 'arrival' | 'departure';
        guest: T;
      }[] = [];

      for (const guest of stays) {
        const arrival = new Date(guest.visitedDate);

        const departure = new Date(guest.visitedDate);

        departure.setDate(departure.getDate() + guest.nights);

        events.push({
          date: arrival.getTime(),
          type: 'arrival',
          guest,
        });

        events.push({
          date: departure.getTime(),
          type: 'departure',
          guest,
        });
      }

      /*
       * IMPORTANTE:
       *
       * Si alguien sale el mismo día que otra persona llega,
       * primero procesamos la salida.
       *
       * Por lo tanto NO se consideran simultáneos.
       */
      events.sort((a, b) => {
        if (a.date !== b.date) {
          return a.date - b.date;
        }

        if (a.type === 'departure' && b.type === 'arrival') {
          return -1;
        }

        if (a.type === 'arrival' && b.type === 'departure') {
          return 1;
        }

        return 0;
      });

      const currentGuests = new Map<string, T>();

      let maxGuests: T[] = [];

      for (const event of events) {
        const guestKey = event.guest.groupId ?? event.guest.guestId ?? event.guest.fullName;

        if (event.type === 'arrival') {
          currentGuests.set(guestKey, event.guest);

          if (currentGuests.size > maxGuests.length) {
            maxGuests = [...currentGuests.values()];
          }
        } else {
          currentGuests.delete(guestKey);
        }
      }

      return {
        total: maxGuests.length,
        guests: maxGuests.map((guest) => this.mapRankingGuest(guest)),
      };
    };

    return {
      // Únicamente huéspedes individuales
      solo: calculate(guests.filter((guest) => !guest.groupId)),

      // Todos, contando cada grupo como 1
      overall: calculate(guests),
    };
  }

  private async getStays(): Promise<StaysStats> {
    const guests = await this.model.find().lean();

    return {
      longest: this.getLongestStays(guests),
      shortest: this.getShortestStays(guests),
      sameDates: this.getSameDates(guests),
      sameArrival: this.getSameArrival(guests),
      maxPeopleTogether: this.getMaxPeopleTogether(guests),
    };
  }
}

export const statsGuestService = new StatsGuestService(GuestModel);
