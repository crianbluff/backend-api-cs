import { Continent, Region, Gender, GroupType } from './guest.types';

export interface StatsGuestsResponse {
  summary: SummaryStats;
  rankings: RankingsStats;
  demographics: DemographicsStats;
  ratings: RatingsStats;
  geography: GeographyStats;
  gifts: GiftStats;
  timeline: TimelineStats;
  stays: StaysStats;
}

export interface SummaryStats {
  totalGuests: number;
  totalGuestsSolo: number;
  totalGuestsGroups: number;

  totalVisits: number;

  totalNights: number;
  averageNightsGeneral: number;
  averageNightsSolo: number;
  averageNightsGroup: number;

  giftsReceived: number;
  guestsWithoutGift: number;

  averageRatingGeneral: number;
  averageRatingSolo: number;
  averageRatingGroup: number;
}

export interface RankingsStats {
  women: {
    solo: RankingItem[];
    overall: RankingItem[];
  };

  men: {
    solo: RankingItem[];
    overall: RankingItem[];
  };

  people: {
    solo: RankingItem[];
    overall: RankingItem[];
  };

  groups: {
    overall: RankingItem[];
    couple: RankingItem[];
    friends: RankingItem[];
    family: RankingItem[];
  };
}

export interface RankingItem {
  position: number;
  guest: RankingGuest;
}

export interface RankingGuest {
  guestId?: string;
  fullName: string;

  gender?: Gender;

  groupId?: string | null;
  groupType?: string | null;

  hometownCode?: string | null;
  continent?: string | null;
  region?: string | null;

  visitedDate?: string;

  birthDate?: string | Date | null;
}

export interface DemographicsStats {
  totals: {
    overall: GenderCount;

    groups: {
      solo: GenderCount;
      couple: GenderCount;
      friends: GenderCount;
      family: GenderCount;
    };
  };

  oldest: AgeGroups;

  youngest: AgeGroups;

  mostVisitedGender: {
    solo: Gender;
    overall: Gender;
    group: Gender;

    couple: Gender;
    friends: Gender;
    family: Gender;
  };

  firstLast: FirstLastGroups;
}

export interface GenderCount {
  male: number;
  female: number;
  trans: number;
  isGay: number;
}

export interface AgeGroups {
  solo: {
    male: RankingGuest[];
    female: RankingGuest[];
    trans: RankingGuest[];
    isGay: RankingGuest[];
  };

  overall: {
    people: RankingGuest[];
  };

  couple: RankingGuest[];
  friends: RankingGuest[];
  family: RankingGuest[];
}

export interface FirstLastGroups {
  overall: {
    people: FirstLastRanking;
  };

  solo: {
    female: FirstLastRanking;
    male: FirstLastRanking;
    trans: FirstLastRanking;
    isGay: FirstLastRanking;
  };

  couple: FirstLastRanking;
  friends: FirstLastRanking;
  family: FirstLastRanking;
}

export interface FirstLastRanking {
  first: RankingGuest | null;
  last: RankingGuest | null;
}

export interface RatingDistribution {
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  '5': number;
  unrated: number;
}

export interface RatingGuest extends RankingGuest {
  rating: number;
}

export interface RatingsStats {
  distribution: {
    solo: RatingDistribution;
    overall: RatingDistribution;
    couple: RatingDistribution;
    friends: RatingDistribution;
    family: RatingDistribution;
  };

  highest: {
    solo: RatingGuest[];
    overall: RatingGuest[];
    couple: RatingGuest[];
    friends: RatingGuest[];
    family: RatingGuest[];
  };

  lowest: {
    solo: RatingGuest[];
    overall: RatingGuest[];
    couple: RatingGuest[];
    friends: RatingGuest[];
    family: RatingGuest[];
  };
}

export interface CountryStats {
  all: CountryItem[];
  top: CountryItem[];
  bottom: CountryItem[];
  topMale: CountryItem[];
  topFemale: CountryItem[];
  mostConsecutive: CountryConsecutive | null;
}

export interface CountryItem {
  code: string;
  total: number;
  male: number;
  female: number;
  firstVisit: string;
}

export interface CountryConsecutive {
  code: string;
  streak: number;
}

export interface LocationItem {
  code: string | null;
  name: string | null;
  total: number;
}

export interface LocationRanking {
  top: LocationItem[];
}

export interface GeographyItem {
  code: Continent;
  total: number;
  firstVisit: string;
}

export interface GeographyRanking {
  all: GeographyItem[];
  top: GeographyItem[];
  bottom: GeographyItem[];
}

export interface GeographyStats {
  continents: GeographyRanking;
  regions: GeographyRanking;
  countries: CountryStats;
  livingIn: LocationRanking;
  hometown: LocationRanking;
}

export interface CountryConsecutive {
  code: string;
  streak: number;
  firstVisit: string;
  lastVisit: string;
  guests: RankingGuest[];
}

export interface GiftItem extends RankingGuest {
  total: number;
  gifts: string[];
}

export interface GiftStats {
  solo: GiftItem[];
  groups: GiftItem[];
}

export interface TimelineItem {
  period: string;
  total: number;
}

export interface TimelineArrivalItem {
  date: string;
  total: number;
  guests: RankingGuest[];
}

export interface TimelineGuestItem {
  guest: RankingGuest;
  overlap: number;
  guests: RankingGuest[];
}

export interface TimelineStats {
  years: TimelineItem[];
  months: TimelineItem[];
  days: TimelineItem[];

  sameArrivalDay: TimelineArrivalItem[];
  sameStay: TimelineGuestItem[];
}

export interface StayItem {
  guest: RankingGuest;
  nights: number;
}

export interface StayRanking {
  solo: StayItem[];
  overall: StayItem[];
  friends: StayItem[];
  couple: StayItem[];
  family: StayItem[];
}

export interface StayOverlapItem {
  total: number;
  guests: RankingGuest[];
}

export interface StayArrivalItem {
  date: string;
  total: number;
  guests: RankingGuest[];
}

export interface MaxPeopleTogetherItem {
  total: number;
  guests: RankingGuest[];
}

export interface MaxPeopleTogether {
  solo: MaxPeopleTogetherItem;
  overall: MaxPeopleTogetherItem;
}

export interface StaysStats {
  longest: StayRanking;
  shortest: StayRanking;
  sameDates: StayOverlapItem[];
  sameArrival: StayArrivalItem[];
  maxPeopleTogether: MaxPeopleTogether;
}
