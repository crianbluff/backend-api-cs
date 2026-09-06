import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';
import fs from 'fs';
import path from 'path';
import { isValidAlpha3 } from '../utils/iso3166';

dotenv.config();

const GROUP_TYPES = new Set(['solo', 'couple', 'family', 'friends']);
const CONTINENTS = new Set(['africa', 'america', 'europe', 'asia', 'oceania']);

const REGIONS = new Set([
  'oceania',
  'melanesia',
  'micronesia',
  'polinesia',
  'central_asia',
  'east_asia',
  'south_asia',
  'southeast_asia',
  'west_asia',
  'northern_africa',
  'western_africa',
  'central_africa',
  'eastern_africa',
  'southern_africa',
  'south_america',
  'north_america',
  'central_america',
  'caribbean',
  'northern_europe',
  'central_europe',
  'western_europe',
  'eastern_europe',
  'southern_europe',
  'scandinavia',
  'baltics',
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
  const countryCodeWeMet = raw.countryCodeWeMet ? String(raw.countryCodeWeMet).trim().toUpperCase() : null;
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

  if (countryCodeWeMet && !isValidAlpha3(countryCodeWeMet)) {
    throw new Error(`Invalid countryCodeWeMet "${countryCodeWeMet}"`);
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

function parseDateToISO(value: string | null | undefined): string | null {
  if (!value) return null;
  const s = String(value).trim();

  if (/^\d{4}$/.test(s)) return s;
  if (/^\d{4}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  const d = new Date(s);

  if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return null;
}

function nullify(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const result = String(value).trim();
  return result === '' ? null : result;
}

function buildGuest(raw: any, groupIdMap: Map<string, string>) {
  validateGuest(raw);

  const groupType = normalizeGroupType(raw.groupType);
  let groupId: string | null = null;

  if (groupType !== 'solo' && raw.groupId != null) {
    const originalGroupId = String(raw.groupId);

    if (!groupIdMap.has(originalGroupId)) {
      groupIdMap.set(originalGroupId, nanoid(11));
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
    ambassador: raw.ambassador ?? false,
    didTheyReq: raw.didTheyReq ?? false,
    gift: Array.isArray(raw.gift) && raw.gift.length ? raw.gift : null,
    comments: nullify(raw.comments),
    rating: raw.rating ?? null,
    hometownCode: raw.hometownCode ? String(raw.hometownCode).trim().toUpperCase() : null,
    countryCodeWeMet: raw.countryCodeWeMet ? String(raw.countryCodeWeMet).trim().toUpperCase() : null,
    livingInCode: raw.livingInCode ? String(raw.livingInCode).trim().toUpperCase() : null,
    prefixCode: raw.prefixCode ?? null,
    continent: nullify(raw.continent),
    region: nullify(raw.region),
    fullName: raw.fullName ?? 'Unknown',
    hometown: nullify(raw.hometown),
    livingIn: nullify(raw.livingIn),
    cityWeMet: nullify(raw.cityWeMet),
    locationWeMet: nullify(raw.locationWeMet),
    birthDate: nullify(raw.birthDate),
    occupation: Array.isArray(raw.occupation) && raw.occupation.length ? raw.occupation : [],
    urlProfileCs: nullify(raw.urlProfileCs),
    gender: raw.gender ?? 'trans',
    isGay: raw.isGay ?? false,
    whatsapp: nullify(raw.whatsapp),
    instagram: nullify(raw.instagram),
    theirReference: nullify(raw.theirReference),
    myReference: nullify(raw.myReference),
  };
}

/**
 * ============================================================
 * COLLECTION CONFIG
 * ============================================================
 */

const GUESTS_SOLO_FILES = [
  'src/scripts/guests/solo/africa-solo.json',
  'src/scripts/guests/solo/america-solo.json',
  'src/scripts/guests/solo/asia-solo.json',
  'src/scripts/guests/solo/europe-solo.json',
  'src/scripts/guests/solo/oceania-solo.json',
];

const GUESTS_GROUP_FILES = [
  // 'src/scripts/guests/group/africa-group.json',
  'src/scripts/guests/group/america-group.json',
  'src/scripts/guests/group/asia-group.json',
  'src/scripts/guests/group/europe-group.json',
  'src/scripts/guests/group/oceania-group.json',
];

const HOSTED_SOLO_FILES = [
  // 'src/scripts/hosted/solo/africa-hosted-solo.json',
  'src/scripts/hosted/solo/america-hosted-solo.json',
  // 'src/scripts/hosted/solo/asia-hosted-solo.json',
  'src/scripts/hosted/solo/europe-hosted-solo.json',
  // 'src/scripts/hosted/solo/oceania-hosted-solo.json',
];

const HOSTED_GROUP_FILES = [
  // 'src/scripts/hosted/group/africa-hosted-group.json',
  'src/scripts/hosted/group/america-hosted-group.json',
  // 'src/scripts/hosted/group/asia-hosted-group.json',
  // 'src/scripts/hosted/group/europe-hosted-group.json',
  // 'src/scripts/hosted/group/oceania-hosted-group.json',
];

const PERSONAL_FILES = [
  // 'src/scripts/personal/africa-personal.json',
  'src/scripts/personal/america-personal.json',
  'src/scripts/personal/asia-personal.json',
  'src/scripts/personal/europe-personal.json',
  // 'src/scripts/personal/oceania-personal.json',
];

const HOSTED_DID_I_GO_WITH_FILES = 'src/scripts/hosted/group/did-i-go-with/did-i-go-with.json';

/**
 * ============================================================
 * GENERIC SEEDER
 * ============================================================
 */

async function seedCollection(options: { collection: string; soloFiles: string[]; groupFiles?: string[] }) {
  const { collection, soloFiles, groupFiles = [] } = options;
  console.log(`\n🌱 Loading "${collection}"...`);

  const soloData = soloFiles.flatMap(loadJSONFile);
  const groupData = groupFiles.flatMap(loadJSONFile);
  const allData = [...soloData, ...groupData];

  console.log(`📦 Loaded ${allData.length} records`);
  const db = mongoose.connection.db;

  if (!db) throw new Error('No DB connection');

  await db.collection(collection).deleteMany({});
  console.log(`🗑️ Cleared "${collection}" collection`);
  const groupIdMap = new Map<string, string>();
  const documents = allData.map((guest) => buildGuest(guest, groupIdMap));
  await db.collection(collection).insertMany(documents);
  console.log(`✅ Inserted ${documents.length} documents into "${collection}"`);
}

async function seedCollectionHosted(options: {
  collection: string;
  soloFiles: string[];
  companyFile: string;
  groupFiles?: string[];
}) {
  const { collection, soloFiles, companyFile, groupFiles = [] } = options;
  console.log(`\n🌱 Loading "${collection}"...`);

  const soloData = soloFiles.flatMap(loadJSONFile);
  const groupData = groupFiles.flatMap(loadJSONFile);
  const companyData = [companyFile].flat().flatMap(loadJSONFile);

  groupData.forEach(
    (g) =>
      (g.members = g.didIGoWith.flatMap((profileUrl: string) =>
        companyData.filter((company) => company.urlProfileCs === profileUrl)
      ))
  );

  const allData = [...soloData, ...groupData];

  console.log(`📦 Loaded ${allData.length} records`);
  const db = mongoose.connection.db;

  if (!db) throw new Error('No DB connection');

  await db.collection(collection).deleteMany({});
  console.log(`🗑️ Cleared "${collection}" collection`);
  const groupIdMap = new Map<string, string>();
  const documents = allData.map((guest) => buildGuest(guest, groupIdMap));
  await db.collection(collection).insertMany(documents);
  console.log(`✅ Inserted ${documents.length} documents into "${collection}"`);
}

/**
 * ============================================================
 * MAIN
 * ============================================================
 */

function requireEnv(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

const MONGO_URI = requireEnv('MONGO_URI');

async function seed() {
  console.log('🚀 Starting database seed...\n');

  await mongoose.connect(MONGO_URI);

  try {
    await seedCollection({
      collection: 'guests',
      soloFiles: GUESTS_SOLO_FILES,
      groupFiles: GUESTS_GROUP_FILES,
    });

    await seedCollectionHosted({
      collection: 'hosted',
      soloFiles: HOSTED_SOLO_FILES,
      groupFiles: HOSTED_GROUP_FILES,
      companyFile: HOSTED_DID_I_GO_WITH_FILES,
    });

    await seedCollection({
      collection: 'personal',
      soloFiles: PERSONAL_FILES,
    });

    console.log('\n🎉 All collections seeded successfully.');
    console.log('MONGO_URI:', process.env.MONGO_URI);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
  }
}

seed().catch((error) => {
  console.error('\n❌ Seed failed:', error);
  process.exit(1);
});
