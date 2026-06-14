/**
 * Seed script — populates the database with initial guest data from seed-data.json
 *
 * Usage (with Docker running):
 *   npm run seed:docker
 *
 * Usage (local):
 *   npm run seed
 *
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
  countryCode?: string;
  prefixCode?: string | null;
  continent?: string;
  region?: string;
  fullName?: string | null;
  birthplace?: string | null;
  'living in'?: string | null;
  birthyear?: number | string | null;
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
  didWeHangOut: boolean | null;
  visitedMonth: string;
  visitedYear: number;
  wasACouple?: boolean;
  coupleId?: number | null;
  gift?: string[];
  comments?: string | null;
  coupleInfo?: RawIndividual[];
}

interface RawCoupleGroup {
  nights: number;
  stayed: boolean;
  didWeHangOut: boolean | null;
  visitedMonth: string;
  visitedYear: number;
  wasACouple?: boolean;
  coupleId?: number;
  gift?: string[];
  comments?: string | null;
  coupleInfo: RawIndividual[];
  // Fields sometimes hoisted to root (coupleId 17 & 18 pattern)
  countryCode?: string;
  prefixCode?: string | null;
  continent?: string;
  region?: string;
  birthplace?: string | null;
  'living in'?: string | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function nullify(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str === '' ? null : str;
}

function normaliseInstagram(value: string | string[] | null | undefined): string | null {
  if (Array.isArray(value)) return nullify(value[0]);
  return nullify(value);
}

function normaliseBirthyear(value: number | string | null | undefined): number | null {
  if (value === null || value === undefined) return null;
  const n = typeof value === 'string' ? parseInt(value, 10) : value;
  if (isNaN(n) || n === 0) return null;
  return n;
}

function normaliseGift(value: string[] | null | undefined): string[] | null {
  if (!value || value.length === 0) return null;
  return value;
}

function normaliseOccupation(value: string[] | string | null | undefined): string[] {
  if (!value) return [];
  if (typeof value === 'string') return value ? [value] : [];
  return value.filter((o) => o && o.trim() !== '');
}

// Map raw continent values to the 5 allowed continents
function normaliseContinent(raw: string | null | undefined): string {
  if (!raw) return 'America';
  const map: Record<string, string> = {
    africa: 'Africa',
    america: 'America',
    'south america': 'America',
    'north america': 'America',
    'central america': 'America',
    caribe: 'America',
    europe: 'Europe',
    asia: 'Asia',
    oceania: 'Oceania',
  };
  return map[raw.toLowerCase()] ?? 'America';
}

function normaliseRegion(raw: string | null | undefined, continent?: string): string {
  if (!raw) {
    // Fallback based on continent
    const fallbacks: Record<string, string> = {
      Africa: 'Africa',
      America: 'South America',
      Europe: 'West Europe',
      Asia: 'Eastern Asia',
      Oceania: 'Oceania',
    };
    return fallbacks[continent ?? 'America'] ?? 'South America';
  }
  const VALID_REGIONS = [
    'North America',
    'Central America',
    'South America',
    'Caribe',
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
  // Try exact match first
  const exact = VALID_REGIONS.find((r) => r.toLowerCase() === raw.toLowerCase());
  if (exact) return exact;
  // Partial match
  const partial = VALID_REGIONS.find((r) => raw.toLowerCase().includes(r.toLowerCase()));
  return partial ?? 'South America';
}

function normaliseIndividual(raw: RawIndividual, rootFallback?: RawCoupleGroup) {
  const rawContinent = raw.continent ?? rootFallback?.continent;
  const rawRegion = raw.region ?? rootFallback?.region;
  const continent = normaliseContinent(rawContinent);
  const region = normaliseRegion(rawRegion, continent);

  return {
    rating: raw.rating ?? null,
    countryCode: nullify(raw.countryCode ?? rootFallback?.countryCode) ?? 'unk',
    prefixCode: nullify(raw.prefixCode ?? rootFallback?.prefixCode),
    continent,
    region,
    fullName: nullify(raw.fullName) ?? 'Unknown',
    birthplace: nullify(raw.birthplace ?? rootFallback?.birthplace),
    livingIn: nullify(raw['living in'] ?? rootFallback?.['living in']),
    birthyear: normaliseBirthyear(raw.birthyear),
    occupation: normaliseOccupation(raw.occupation),
    urlProfileCs: raw.urlProfileCs && String(raw.urlProfileCs).trim() !== '' ? raw.urlProfileCs : null,
    gender: raw.gender ?? 'male',
    whatsapp: nullify(raw.whatsapp),
    instagram: normaliseInstagram(raw.instagram),
  };
}

// ─── Document builders ────────────────────────────────────────────────────────

function buildSoloDoc(raw: RawSolo) {
  return {
    guestId: nanoid(11),
    coupleId: null,
    nights: raw.nights,
    stayed: raw.stayed,
    didWeHangOut: raw.didWeHangOut ?? false,
    visitedMonth: raw.visitedMonth,
    visitedYear: raw.visitedYear,
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
    didWeHangOut: raw.didWeHangOut ?? false,
    visitedMonth: raw.visitedMonth,
    visitedYear: raw.visitedYear,
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

  const collections = await db.listCollections({ name: 'guests' }).toArray();
  if (collections.length > 0) {
    await db.collection('guests').drop();
    console.log('🗑️   Dropped existing guests collection');
  }

  const docs: object[] = [];
  let skipped = 0;

  for (const item of rawData as Array<RawSolo | RawCoupleGroup[]>) {
    // ── Couple group: raw item is an array ──
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

    // ── Solo entry ──
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
