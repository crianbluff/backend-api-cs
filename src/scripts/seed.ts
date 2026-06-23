/**
 * Seed script — populates the database from seed-data.json
 * Usage (Docker):  npm run seed:docker
 * Usage (local):   npm run seed
 * Idempotent: drops the guests collection before inserting.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';
import rawData from './seed-data.json';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/guests_db';

// ─── Raw JSON types ───────────────────────────────────────────────────────────

interface RawIndividual {
  rating?: number | null;
  // accept both old (countryCode) and new (hometownCode) field names
  countryCode?: string;
  hometownCode?: string;
  livingInCode?: string | null;
  prefixCode?: string | null;
  continent?: string;
  region?: string;
  fullName?: string | null;
  // accept both old (birthplace) and new (hometown) field names
  birthplace?: string | null;
  hometown?: string | null;
  'living in'?: string | null;
  livingIn?: string | null;
  // accept both old (birthyear) and new (birthDate) field names
  birthyear?: number | string | null;
  birthDate?: string | null;
  occupation?: string[] | string;
  urlProfileCs?: string | number | null;
  gender?: string;
  whatsapp?: string | null;
  instagram?: string | string[] | null;
  gift?: string[];
  comments?: string | null;
}

interface RawSolo extends RawIndividual {
  nights: number;
  stayed: boolean;
  // accept both old (didWeHangOut) and new (hangOut) field names
  didWeHangOut?: boolean | null;
  hangOut?: boolean | null;
  visitedDate: string;
  wasACouple?: boolean;
  coupleId?: number | null;
  isFirstTime?: boolean;
  gift?: string[];
  comments?: string | null;
  coupleInfo?: RawIndividual[];
}

interface RawCoupleGroup {
  nights: number;
  stayed: boolean;
  didWeHangOut?: boolean | null;
  hangOut?: boolean | null;
  visitedDate: string;
  wasACouple?: boolean;
  coupleId?: number;
  isFirstTime?: boolean;
  gift?: string[];
  comments?: string | null;
  coupleInfo: RawIndividual[];
  // Fields hoisted to root
  countryCode?: string;
  hometownCode?: string;
  livingInCode?: string | null;
  prefixCode?: string | null;
  continent?: string;
  region?: string;
  birthplace?: string | null;
  hometown?: string | null;
  'living in'?: string | null;
  livingIn?: string | null;
  rating?: number | null;
}

// ─── Normalisation helpers ────────────────────────────────────────────────────

function nullify(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str === '' ? null : str;
}

function normaliseInstagram(value: string | string[] | null | undefined): string | null {
  if (Array.isArray(value)) return nullify(value[0]);
  return nullify(value);
}

/**
 * Normalise birthDate: accepts number (old birthyear), string year, or full date string.
 * Always returns a string like "2000", "March 2000", or "15 March 2000", or null.
 */
function normaliseBirthDate(
  birthDate: string | null | undefined,
  birthyear: number | string | null | undefined
): string | null {
  // Prefer new birthDate field
  if (birthDate !== null && birthDate !== undefined) {
    const s = String(birthDate).trim();
    return s === '' ? null : s;
  }
  // Fall back to old birthyear
  if (birthyear !== null && birthyear !== undefined) {
    const n = typeof birthyear === 'string' ? parseInt(birthyear, 10) : birthyear;
    if (!isNaN(n) && n !== 0) return String(n);
  }
  return null;
}

function normaliseGift(value: string[] | null | undefined): string[] | null {
  if (!value || value.length === 0) return null;
  return value;
}

function normaliseOccupation(value: string[] | string | null | undefined): string[] {
  if (!value) return [];
  if (typeof value === 'string') return value.trim() ? [value] : [];
  return value.filter((o) => o && o.trim() !== '');
}

function normaliseContinent(raw: string | null | undefined): string {
  if (!raw) return 'America';
  const map: Record<string, string> = {
    africa: 'Africa',
    america: 'America',
    'south america': 'America',
    'north america': 'America',
    'central america': 'America',
    caribe: 'America',
    caribbean: 'America',
    europe: 'Europe',
    asia: 'Asia',
    oceania: 'Oceania',
  };
  return map[raw.toLowerCase()] ?? raw;
}

function normaliseRegion(raw: string | null | undefined, continent?: string): string {
  if (!raw) {
    const fallbacks: Record<string, string> = {
      Africa: 'Africa',
      America: 'South America',
      Europe: 'West Europe',
      Asia: 'Eastern Asia',
      Oceania: 'Oceania',
    };
    return fallbacks[continent ?? 'America'] ?? 'South America';
  }
  const VALID = [
    'North America',
    'Central America',
    'South America',
    'Caribbean',
    'Middle East Asia',
    'Southeast Asia',
    'Eastern Asia',
    'South Asia',
    'Central Asia',
    'West Europe',
    'Scandinavia',
    'Southern Europe',
    'Northern Europe',
    'Eastern Europe',
    'Oceania',
    'Africa',
  ];
  // Also map old "Caribe" → "Caribbean"
  if (raw.toLowerCase() === 'caribe') return 'Caribbean';
  const exact = VALID.find((r) => r.toLowerCase() === raw.toLowerCase());
  if (exact) return exact;
  const partial = VALID.find((r) => raw.toLowerCase().includes(r.toLowerCase()));
  return partial ?? 'South America';
}

function getHometownCode(raw: RawIndividual, fallback?: RawCoupleGroup): string {
  const code = raw.hometownCode ?? raw.countryCode ?? fallback?.hometownCode ?? fallback?.countryCode;
  return (nullify(code) ?? 'UNK').toUpperCase();
}

function normaliseIndividual(raw: RawIndividual, rootFallback?: RawCoupleGroup) {
  const rawContinent = raw.continent ?? rootFallback?.continent;
  const rawRegion = raw.region ?? rootFallback?.region;
  const continent = normaliseContinent(rawContinent);
  const region = normaliseRegion(rawRegion, continent);

  // livingIn: prefer named field, fall back to "living in" key
  const livingIn = nullify(raw.livingIn ?? raw['living in'] ?? rootFallback?.livingIn ?? rootFallback?.['living in']);
  // hometown: prefer named field, fall back to old birthplace
  const hometown = nullify(raw.hometown ?? raw.birthplace ?? rootFallback?.hometown ?? rootFallback?.birthplace);

  return {
    rating: raw.rating ?? null,
    hometownCode: getHometownCode(raw, rootFallback),
    livingInCode: nullify(raw.livingInCode ?? rootFallback?.livingInCode)?.toUpperCase() ?? null,
    prefixCode: nullify(raw.prefixCode ?? rootFallback?.prefixCode),
    continent,
    region,
    fullName: nullify(raw.fullName) ?? 'Unknown',
    hometown,
    livingIn,
    birthDate: normaliseBirthDate(raw.birthDate, raw.birthyear),
    occupation: normaliseOccupation(raw.occupation),
    urlProfileCs: raw.urlProfileCs && String(raw.urlProfileCs).trim() !== '' ? raw.urlProfileCs : null,
    gender: raw.gender ?? 'male',
    whatsapp: nullify(raw.whatsapp),
    instagram: normaliseInstagram(raw.instagram),
  };
}

// ─── Document builders ────────────────────────────────────────────────────────

function getHangOut(raw: { didWeHangOut?: boolean | null; hangOut?: boolean | null }): boolean {
  return raw.hangOut ?? raw.didWeHangOut ?? false;
}

function buildSoloDoc(raw: RawSolo) {
  return {
    guestId: nanoid(11),
    coupleId: null,
    nights: raw.nights,
    stayed: raw.stayed,
    hangOut: getHangOut(raw),
    visitedDate: raw.visitedDate ?? '',
    isFirstTime: raw.isFirstTime ?? false,
    gift: normaliseGift(raw.gift),
    comments: nullify(raw.comments),
    wasACouple: false,
    ...normaliseIndividual(raw),
  };
}

function buildCoupleDoc(raw: RawCoupleGroup) {
  const [memberA, memberB] = raw.coupleInfo;
  return {
    guestId: nanoid(11),
    coupleId: nanoid(18),
    nights: raw.nights,
    stayed: raw.stayed,
    hangOut: getHangOut(raw),
    visitedDate: raw.visitedDate ?? '',
    isFirstTime: raw.isFirstTime ?? false,
    gift: normaliseGift(raw.gift),
    comments: nullify(raw.comments),
    wasACouple: true,
    coupleInfo: [normaliseIndividual(memberA, raw), normaliseIndividual(memberB, raw)],
  };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  console.log('🌱  Connecting to MongoDB...');
  await mongoose.connect(MONGO_URI);
  console.log(`✅  Connected to: ${mongoose.connection.host}`);

  const db = mongoose.connection.db;
  if (!db) throw new Error('No database connection');

  const existing = await db.listCollections({ name: 'guests' }).toArray();
  if (existing.length > 0) {
    await db.collection('guests').drop();
    console.log('🗑️   Dropped existing guests collection');
  }

  const docs: object[] = [];
  let skipped = 0;

  for (const item of rawData as Array<RawSolo | RawCoupleGroup[]>) {
    if (Array.isArray(item)) {
      for (const coupleGroup of item) {
        try {
          if (!coupleGroup.coupleInfo || coupleGroup.coupleInfo.length < 2) {
            if (coupleGroup.coupleInfo?.length === 1) {
              docs.push(buildSoloDoc({ ...coupleGroup, ...coupleGroup.coupleInfo[0] } as RawSolo));
            } else {
              console.warn(`⚠️  Skipping malformed couple (coupleId: ${coupleGroup.coupleId})`);
              skipped++;
            }
          } else {
            docs.push(buildCoupleDoc(coupleGroup));
          }
        } catch (err) {
          console.warn(`⚠️  Error on couple coupleId=${coupleGroup.coupleId}:`, err);
          skipped++;
        }
      }
      continue;
    }

    const raw = item as RawSolo;
    try {
      if (raw.coupleInfo && raw.coupleInfo.length >= 2) {
        docs.push(buildCoupleDoc(raw as unknown as RawCoupleGroup));
      } else {
        docs.push(buildSoloDoc(raw));
      }
    } catch (err) {
      console.warn(`⚠️  Error on guest "${raw.fullName}":`, err);
      skipped++;
    }
  }

  if (docs.length > 0) {
    await db.collection('guests').insertMany(docs);
    console.log(`✅  Inserted ${docs.length} guests`);
  }

  if (skipped > 0) console.log(`⚠️  Skipped ${skipped} malformed records`);

  await mongoose.disconnect();
  console.log('🏁  Seed complete.');
}

seed().catch((err) => {
  console.error('❌  Seed failed:', err);
  process.exit(1);
});
