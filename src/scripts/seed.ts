/**
 * Seed script — populates the database with initial guest data from seed-data.json
 *
 * Usage (with Docker running):
 *   npm run seed:docker
 *
 * Usage (local):
 *   npm run seed
 *
 * The script is idempotent: drops the guests collection before inserting.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';
import rawData from './seed-data.json';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/guests_db';

// ─── Raw JSON types ───────────────────────────────────────────────────────────

interface RawIndividual {
  rating?:       number | null;
  countryCode?:  string;
  prefixCode?:   string | null;
  continent?:    string;
  fullName?:     string | null;
  birthplace?:   string | null;
  'living in'?:  string | null;
  birthyear?:    number | string | null;
  occupation?:   string[];
  urlProfileCs?: string | number | null;
  gender?:       string;
  whatsapp?:     string | null;
  instagram?:    string | string[] | null;
}

interface RawSolo extends RawIndividual {
  nights:       number;
  stayed:       boolean;
  didWeHangOut: boolean | null;
  visitedMonth: string;
  visitedYear:  number;
  wasACouple?:  boolean;
  coupleId?:    number | null;
  gift?:        string[];
  comments?:    string | null;
  coupleInfo?:  RawIndividual[];
}

interface RawCoupleGroup {
  nights:       number;
  stayed:       boolean;
  didWeHangOut: boolean | null;
  visitedMonth: string;
  visitedYear:  number;
  wasACouple?:  boolean;
  coupleId?:    number;
  gift?:        string[];
  comments?:    string | null;
  coupleInfo:   RawIndividual[];
  countryCode?: string;
  prefixCode?:  string | null;
  continent?:   string;
  birthplace?:  string | null;
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
  return isNaN(n) ? null : n;
}

function normaliseGift(value: string[] | null | undefined): string[] | null {
  if (!value || value.length === 0) return null;
  return value;
}

function normaliseIndividual(raw: RawIndividual, rootFallback?: RawCoupleGroup) {
  return {
    rating:       raw.rating ?? null,
    countryCode:  nullify(raw.countryCode ?? rootFallback?.countryCode) ?? 'unk',
    prefixCode:   nullify(raw.prefixCode  ?? rootFallback?.prefixCode),
    continent:    nullify(raw.continent   ?? rootFallback?.continent) ?? 'Europe',
    fullName:     nullify(raw.fullName) ?? 'Unknown',
    birthplace:   nullify(raw.birthplace ?? rootFallback?.birthplace),
    livingIn:     nullify(raw['living in'] ?? rootFallback?.['living in']),
    birthyear:    normaliseBirthyear(raw.birthyear),
    occupation:   Array.isArray(raw.occupation) ? raw.occupation : [],
    urlProfileCs: raw.urlProfileCs ?? null,
    gender:       raw.gender ?? 'male',
    whatsapp:     nullify(raw.whatsapp),
    instagram:    normaliseInstagram(raw.instagram),
  };
}

// ─── Document builders ────────────────────────────────────────────────────────

function buildSoloDoc(raw: RawSolo) {
  return {
    guestId:      nanoid(11),
    coupleId:     null,
    nights:       raw.nights,
    stayed:       raw.stayed,
    didWeHangOut: raw.didWeHangOut ?? false,
    visitedMonth: raw.visitedMonth,
    visitedYear:  raw.visitedYear,
    gift:         normaliseGift(raw.gift),
    comments:     nullify(raw.comments),
    wasACouple:   false,
    ...normaliseIndividual(raw),
  };
}

function buildCoupleDoc(raw: RawCoupleGroup) {
  const [memberA, memberB] = raw.coupleInfo;
  return {
    guestId:      nanoid(11),
    coupleId:     nanoid(18),
    nights:       raw.nights,
    stayed:       raw.stayed,
    didWeHangOut: raw.didWeHangOut ?? false,
    visitedMonth: raw.visitedMonth,
    visitedYear:  raw.visitedYear,
    gift:         normaliseGift(raw.gift),
    comments:     nullify(raw.comments),
    wasACouple:   true,
    coupleInfo: [
      normaliseIndividual(memberA, raw),
      normaliseIndividual(memberB, raw),
    ],
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
    if (Array.isArray(item)) {
      for (const coupleGroup of item) {
        try {
          if (!coupleGroup.coupleInfo || coupleGroup.coupleInfo.length < 2) {
            if (coupleGroup.coupleInfo?.length === 1) {
              const solo = { ...coupleGroup, ...coupleGroup.coupleInfo[0] } as RawSolo;
              docs.push(buildSoloDoc(solo));
            } else {
              console.warn(`⚠️  Skipping malformed couple (coupleId: ${coupleGroup.coupleId})`);
              skipped++;
            }
          } else {
            docs.push(buildCoupleDoc(coupleGroup));
          }
        } catch (err) {
          console.warn(`⚠️  Error processing couple group coupleId=${coupleGroup.coupleId}:`, err);
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
      console.warn(`⚠️  Error processing guest "${raw.fullName}":`, err);
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
