import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';
import fs from 'fs';
import path from 'path';
import { isValidAlpha3 } from '../utils/iso3166';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/guests_db';

const GROUP_TYPES = new Set(['solo', 'couple', 'family', 'friends']);

const CONTINENTS = new Set(['africa', 'america', 'europe', 'asia', 'oceania']);

const REGIONS = new Set([
  'north_america',
  'central_america',
  'south_america',
  'caribbean',
  'middle_east_asia',
  'southeast_asia',
  'eastern_asia',
  'south_asia',
  'central_asia',
  'west_europe',
  'scandinavia',
  'southern_europe',
  'northern_europe',
  'eastern_europe',
  'oceania',
  'africa',
]);

function validateGuest(raw: any) {
  const continent = raw.continent ? String(raw.continent).trim().toLowerCase() : null;
  const region = raw.region ? String(raw.region).trim().toLowerCase() : null;
  const groupType = normalizeGroupType(raw.groupType);

  const hometownCode = raw.hometownCode ? String(raw.hometownCode).trim().toUpperCase() : null;
  const livingInCode = raw.livingInCode ? String(raw.livingInCode).trim().toUpperCase() : null;

  if (!continent || !CONTINENTS.has(continent)) {
    throw new Error(`Invalid continent "${raw.continent}" for "${raw.fullName}".`);
  }

  if (!region || !REGIONS.has(region)) {
    throw new Error(`Invalid region "${raw.region}" for "${raw.fullName}".`);
  }

  if (hometownCode && !isValidAlpha3(hometownCode)) {
    throw new Error(`Invalid hometownCode "${raw.hometownCode}" for "${raw.fullName}".`);
  }

  if (livingInCode && !isValidAlpha3(livingInCode)) {
    throw new Error(`Invalid livingInCode "${raw.livingInCode}" for "${raw.fullName}".`);
  }

  if (!GROUP_TYPES.has(groupType)) {
    throw new Error(`Invalid groupType "${raw.groupType}" for "${raw.fullName}".`);
  }
}

/**
 * ----------------------------
 * LOAD FILES SAFE
 * ----------------------------
 */
function loadJSONFile(filePath: string): any[] {
  const fullPath = path.resolve(filePath);

  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️ Missing file: ${fullPath}`);
    return [];
  }

  const data = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));

  return Array.isArray(data) ? data : [data];
}

const SOLO_FILES = [
  'src/scripts/solo/solo-africa.json',
  'src/scripts/solo/solo-america.json',
  'src/scripts/solo/solo-asia.json',
  'src/scripts/solo/solo-europe.json',
  'src/scripts/solo/solo-oceania.json',
];

const GROUP_FILES = [
  'src/scripts/group/america-group.json',
  'src/scripts/group/asia-group.json',
  'src/scripts/group/europe-group.json',
];

/**
 * ----------------------------
 * DATE NORMALIZATION
 * Preserva:
 * YYYY
 * YYYY-MM
 * YYYY-MM-DD
 * ----------------------------
 */
function parseDateToISO(value: string | null | undefined): string | null {
  if (!value) return null;

  const s = String(value).trim();

  if (/^\d{4}$/.test(s)) {
    return s;
  }

  if (/^\d{4}-\d{2}$/.test(s)) {
    return s;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    return s;
  }

  const d = new Date(s);

  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  return null;
}

function normalizeGroupType(value: unknown): string {
  return String(value).trim().toLowerCase();
}

/**
 * ----------------------------
 * HELPERS
 * ----------------------------
 */
function nullify(v: unknown): string | null {
  if (v === null || v === undefined) return null;

  const s = String(v).trim();

  return s === '' ? null : s;
}

/**
 * ----------------------------
 * GROUP ID MAP
 * Reemplaza los groupId originales
 * por un nanoid compartido.
 * ----------------------------
 */
const groupIdMap = new Map<string, string>();

/**
 * ----------------------------
 * BUILD DOCUMENT
 * ----------------------------
 */
function buildGuest(raw: any) {
  validateGuest(raw);

  const groupType = normalizeGroupType(raw.groupType);
  let generatedGroupId: string | undefined;

  const hometownCode = raw.hometownCode ? String(raw.hometownCode).trim().toUpperCase() : null;
  const livingInCode = raw.livingInCode ? String(raw.livingInCode).trim().toUpperCase() : null;

  if (groupType !== 'solo' && raw.groupId != null) {
    const originalGroupId = String(raw.groupId);

    if (!groupIdMap.has(originalGroupId)) {
      groupIdMap.set(originalGroupId, nanoid(11));
    }

    generatedGroupId = groupIdMap.get(originalGroupId)!;
  }

  return {
    guestId: nanoid(11),

    ...(generatedGroupId && {
      groupId: generatedGroupId,
    }),

    groupType,

    nights: raw.nights ?? 0,
    stayed: raw.stayed ?? false,
    hangOut: raw.hangOut ?? false,

    visitedDate: parseDateToISO(raw.visitedDate),

    isFirstTime: raw.isFirstTime ?? false,

    gift: Array.isArray(raw.gift) && raw.gift.length > 0 ? raw.gift : null,

    comments: nullify(raw.comments),

    rating: raw.rating ?? null,

    hometownCode,
    livingInCode,
    prefixCode: raw.prefixCode ?? null,

    continent: nullify(raw.continent),
    region: nullify(raw.region),

    fullName: raw.fullName ?? 'Unknown',
    hometown: nullify(raw.hometown),
    livingIn: nullify(raw.livingIn),

    birthDate: nullify(raw.birthDate),

    occupation: Array.isArray(raw.occupation) && raw.occupation.length > 0 ? raw.occupation : null,

    urlProfileCs: nullify(raw.urlProfileCs),

    gender: raw.gender ?? 'unknown',

    whatsapp: nullify(raw.whatsapp),
    instagram: nullify(raw.instagram),
  };
}

/**
 * ----------------------------
 * SEED
 * ----------------------------
 */
async function seed() {
  console.log('🌱 Loading data...');

  const soloData = SOLO_FILES.flatMap(loadJSONFile);
  const groupData = GROUP_FILES.flatMap(loadJSONFile);

  const allData = [...soloData, ...groupData];

  console.log(`📦 Loaded ${allData.length} records`);

  await mongoose.connect(MONGO_URI);

  const db = mongoose.connection.db;

  if (!db) {
    throw new Error('No DB connection');
  }

  await db.collection('guests').deleteMany({});

  console.log('🗑️ Cleared collection');

  const finalDocs = allData.map(buildGuest);

  await db.collection('guests').insertMany(finalDocs);

  console.log(`✅ Inserted ${finalDocs.length} documents`);

  await mongoose.disconnect();

  console.log('🏁 Done');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
