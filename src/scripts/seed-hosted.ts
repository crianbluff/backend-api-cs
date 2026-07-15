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

function normalizeGroupType(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function validateGuest(raw: any) {
  const continent = raw.continent ? String(raw.continent).trim().toLowerCase() : null;
  const region = raw.region ? String(raw.region).trim().toLowerCase() : null;
  const groupType = normalizeGroupType(raw.groupType);

  const hometownCode = raw.hometownCode ? String(raw.hometownCode).trim().toUpperCase() : null;

  const livingInCode = raw.livingInCode ? String(raw.livingInCode).trim().toUpperCase() : null;

  if (!continent || !CONTINENTS.has(continent)) {
    throw new Error(`Invalid continent "${raw.continent}" for "${raw.fullName}"`);
  }

  if (!region || !REGIONS.has(region)) {
    throw new Error(`Invalid region "${raw.region}" for "${raw.fullName}"`);
  }

  if (hometownCode && !isValidAlpha3(hometownCode)) {
    throw new Error(`Invalid hometownCode "${hometownCode}"`);
  }

  if (livingInCode && !isValidAlpha3(livingInCode)) {
    throw new Error(`Invalid livingInCode "${livingInCode}"`);
  }

  if (!GROUP_TYPES.has(groupType)) {
    throw new Error(`Invalid groupType "${raw.groupType}"`);
  }
}

function loadJSONFile(filePath: string): any[] {
  const fullPath = path.resolve(filePath);

  if (!fs.existsSync(fullPath)) {
    console.warn(`⚠️ Missing file: ${fullPath}`);
    return [];
  }

  const data = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));

  return Array.isArray(data) ? data : [data];
}

const SOLO_FILES = ['src/scripts/hosted/solo/america-hosted-solo.json'];

const GROUP_FILES = ['src/scripts/hosted/group/america-hosted-group.json'];

function parseDateToISO(value: string | null | undefined): string | null {
  if (!value) return null;

  const s = String(value).trim();

  if (/^\d{4}$/.test(s)) return s;

  if (/^\d{4}-\d{2}$/.test(s)) return s;

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const d = new Date(s);

  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }

  return null;
}

function nullify(value: unknown): string | null {
  if (value === null || value === undefined) return null;

  const result = String(value).trim();

  return result === '' ? null : result;
}

const groupIdMap = new Map<string, string>();

function buildGuest(raw: any) {
  validateGuest(raw);

  const groupType = normalizeGroupType(raw.groupType);

  let groupId: string | null = null;

  if (groupType !== 'solo' && raw.groupId != null) {
    const originalGroupId = String(raw.groupId);

    if (!groupIdMap.has(originalGroupId)) {
      groupIdMap.set(originalGroupId, `hosted_${nanoid(11)}`);
    }

    groupId = groupIdMap.get(originalGroupId)!;
  }

  return {
    guestId: nanoid(11),

    groupId,

    groupType,

    nights: raw.nights ?? 0,
    stayed: raw.stayed ?? false,
    hangOut: raw.hangOut ?? false,

    visitedDate: parseDateToISO(raw.visitedDate),

    isFirstTime: raw.isFirstTime ?? false,

    gift: Array.isArray(raw.gift) && raw.gift.length > 0 ? raw.gift : null,

    comments: nullify(raw.comments),

    rating: raw.rating ?? null,

    hometownCode: raw.hometownCode ? String(raw.hometownCode).trim().toUpperCase() : null,

    livingInCode: raw.livingInCode ? String(raw.livingInCode).trim().toUpperCase() : null,

    prefixCode: raw.prefixCode ?? null,

    continent: nullify(raw.continent),
    region: nullify(raw.region),

    fullName: raw.fullName ?? 'Unknown',

    hometown: nullify(raw.hometown),
    livingIn: nullify(raw.livingIn),

    birthDate: nullify(raw.birthDate),

    occupation: Array.isArray(raw.occupation) && raw.occupation.length ? raw.occupation : [],

    urlProfileCs: nullify(raw.urlProfileCs),

    gender: raw.gender ?? 'male',

    isGay: raw.isGay ?? false,

    whatsapp: nullify(raw.whatsapp),

    instagram: nullify(raw.instagram),

    theirReference: nullify(raw.theirReference),

    myReference: nullify(raw.myReference),
  };
}

async function seed() {
  console.log('🌱 Loading hosted data...');

  const soloData = SOLO_FILES.flatMap(loadJSONFile);
  const groupData = GROUP_FILES.flatMap(loadJSONFile);

  const allData = [...soloData, ...groupData];

  console.log(`📦 Loaded ${allData.length} hosted records`);

  await mongoose.connect(MONGO_URI);

  const db = mongoose.connection.db;

  if (!db) {
    throw new Error('No DB connection');
  }

  await db.collection('hosted').deleteMany({});

  console.log('🗑️ Cleared hosted collection');

  const documents = allData.map(buildGuest);

  await db.collection('hosted').insertMany(documents);

  console.log(`✅ Inserted ${documents.length} hosted documents`);

  await mongoose.disconnect();

  console.log('🏁 Hosted seed completed');
}

seed().catch((error) => {
  console.error('❌ Hosted seed failed:', error);
  process.exit(1);
});
