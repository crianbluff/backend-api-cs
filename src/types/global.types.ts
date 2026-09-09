export const CONTINENTS = ['africa', 'america', 'europe', 'asia', 'oceania'] as const;
export type Continent = (typeof CONTINENTS)[number];

export const REGION_OCEANIA = ['oceania', 'melanesia', 'micronesia', 'polinesia'] as const;
export type RegionOceania = (typeof REGION_OCEANIA)[number];

export const REGION_ASIA = ['central_asia', 'east_asia', 'south_asia', 'southeast_asia', 'west_asia'] as const;
export type RegionAsia = (typeof REGION_ASIA)[number];

export const REGION_AFRICA = [
  'northern_africa',
  'western_africa',
  'central_africa',
  'eastern_africa',
  'southern_africa',
] as const;
export type RegionAfrica = (typeof REGION_AFRICA)[number];

export const REGION_EUROPE = [
  'northern_europe',
  'central_europe',
  'western_europe',
  'eastern_europe',
  'southern_europe',
  'scandinavia',
  'baltics',
] as const;

export type RegionEurope = (typeof REGION_EUROPE)[number];
export const REGION_AMERICA = ['south_america', 'north_america', 'central_america', 'caribbean'] as const;
export type RegionAmerica = (typeof REGION_AMERICA)[number];
export const REGIONS = [...REGION_OCEANIA, ...REGION_ASIA, ...REGION_AFRICA, ...REGION_AMERICA, ...REGION_EUROPE] as const;
export type Region = (typeof REGIONS)[number];

export const GENDERS = ['male', 'female', 'trans'] as const;
export type Gender = (typeof GENDERS)[number];
export const GROUP_TYPES = ['solo', 'couple', 'friends', 'family'] as const;
export type GroupType = (typeof GROUP_TYPES)[number];
