import { Continent, Gender, GenderStats, GroupType } from './global.types';

export interface OverallGroupStats<T> extends GroupStats<T> {
  overall: T;
}

export interface GroupStats<T> {
  solo: T;
  couple: T;
  friends: T;
  family: T;
}

export interface RankingItem<T = RankingGuest> {
  position: number;
  guest: T;
}

export interface RankingGuest {
  guestId?: string;
  fullName: string;

  gender?: Gender;

  groupId?: string | null;
  groupType?: GroupType | null;

  hometownCode?: string | null;
  continent?: Continent | null;
  region?: string | null;

  visitedDate?: string;
  birthDate?: string | Date | null;
}

export interface RatingGuest extends RankingGuest {
  rating: number;
}

export interface GenderCount {
  male: number;
  female: number;
  trans: number;
  isGay: number;
}

export interface FirstLastRanking {
  first: RankingGuest | null;
  last: RankingGuest | null;
}

export interface StatsGuestsResponse {
  summary: SummaryStats;
  rankings: RankingsStats;
  demographics: DemographicsStats;
  ratings: RatingsStats;
  geography: GeographyStats;
  gifts: GiftStats;
  timeline: TimelineStats;
  stays: StaysStats;
  birthdays: BirthdayStats;
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
  women: PeopleRanking;
  men: PeopleRanking;
  people: PeopleRanking;
  groups: GroupRanking;
}

export interface PeopleRanking {
  solo: RankingItem[];
  overall: RankingItem[];
}

export type GroupRanking = Omit<OverallGroupStats<RankingItem[]>, 'solo'>;

export interface DemographicsStats {
  totals: {
    overall: GenderCount;
    groups: GroupStats<GenderCount>;
  };

  oldest: AgeGroups;
  youngest: AgeGroups;

  mostVisitedGender: MostVisitedGender;

  firstLast: FirstLastGroups;
}

export interface MostVisitedGender {
  solo: Gender;
  overall: Gender;
  group: Gender;

  couple: Gender;
  friends: Gender;
  family: Gender;
}

export interface AgeGroups {
  solo: GenderStats<RankingGuest[]>;

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

  solo: GenderStats<FirstLastRanking>;

  couple: FirstLastRanking;
  friends: FirstLastRanking;
  family: FirstLastRanking;
}

export interface RatingDistribution {
  '1': number;
  '2': number;
  '3': number;
  '4': number;
  '5': number;
  unrated: number;
}

export interface RatingsStats {
  distribution: OverallGroupStats<RatingDistribution>;
  highest: OverallGroupStats<RatingGuest[]>;
  lowest: OverallGroupStats<RatingGuest[]>;
}

export interface GeographyStats {
  continents: GeographyRanking;
  regions: GeographyRanking;
  countries: CountryStats;
  livingIn: LocationRanking;
  hometown: LocationRanking;
}

export interface GeographyRanking {
  all: GeographyItem[];
}

export interface GeographyItem {
  code: Continent;
  total: number;
  firstVisit: string;
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
  firstVisit: string;
  lastVisit: string;
  guests: RankingGuest[];
}

export interface LocationItem {
  code: string | null;
  name: string | null;
  total: number;
}

export interface LocationRanking {
  top: LocationItem[];
}

export interface GiftStats {
  solo: GiftItem[];
  groups: GiftItem[];
}

export interface GiftItem extends RankingGuest {
  total: number;
  gifts: string[];
}

export interface TimelineStats {
  years: TimelineItem[];
  months: TimelineItem[];
  days: TimelineItem[];

  sameArrivalDay: TimelineArrivalItem[];
  sameStay: TimelineGuestItem[];
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

export interface StaysStats {
  longest: StayRanking;
  shortest: StayRanking;

  sameDates: StayOverlapItem[];
  sameArrival: StayArrivalItem[];

  maxPeopleTogether: MaxPeopleTogether;
}

export interface StayRanking {
  solo: StayItem[];
  overall: StayItem[];
  friends: StayItem[];
  couple: StayItem[];
  family: StayItem[];
}

export interface StayItem {
  guest: RankingGuest;
  nights: number;
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

export interface MaxPeopleTogether {
  solo: MaxPeopleTogetherItem;
  overall: MaxPeopleTogetherItem;
}

export interface MaxPeopleTogetherItem {
  total: number;
  guests: RankingGuest[];
}

export interface BirthdayStats {
  calendar: BirthdayCalendarItem[];
  repeated: BirthdayCalendarItem[];
  unusual: BirthdayUnusualItem[];
}

export interface BirthdayCalendarItem {
  month: number;
  day: number;
  total: number;
  guests: RankingGuest[];
}

export interface BirthdayUnusualItem extends BirthdayCalendarItem {
  reason: string;
}
