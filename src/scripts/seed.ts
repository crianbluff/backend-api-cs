import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';
import fs from 'fs';
import path from 'path';
import { CONTINENTS, REGIONS, GENDERS, GROUP_TYPES } from '../types/global.types';
import { isValidAlpha3 } from '../utils/iso3166';

// COLLECTION CONFIG
const GUESTS_SOLO_FILES = [
  'src/scripts/guests/solo/africa/northern.json',
  'src/scripts/guests/solo/africa/western.json',
  'src/scripts/guests/solo/america/caribbean.json',
  'src/scripts/guests/solo/america/central.json',
  'src/scripts/guests/solo/america/north.json',
  'src/scripts/guests/solo/america/south.json',
  'src/scripts/guests/solo/asia/east.json',
  'src/scripts/guests/solo/asia/south.json',
  'src/scripts/guests/solo/asia/southeast.json',
  'src/scripts/guests/solo/asia/west.json',
  'src/scripts/guests/solo/europe/central.json',
  'src/scripts/guests/solo/europe/eastern.json',
  'src/scripts/guests/solo/europe/northern.json',
  'src/scripts/guests/solo/europe/scandinavia.json',
  'src/scripts/guests/solo/europe/southern.json',
  'src/scripts/guests/solo/europe/western.json',
  'src/scripts/guests/solo/oceania/oceania.json',
];

const GUESTS_GROUP_COUPLE_FILES = [
  'src/scripts/guests/group/couple/america/north.json',
  'src/scripts/guests/group/couple/america/south.json',
  'src/scripts/guests/group/couple/asia/east.json',
  'src/scripts/guests/group/couple/asia/south.json',
  'src/scripts/guests/group/couple/europe/central.json',
  'src/scripts/guests/group/couple/europe/eastern.json',
  'src/scripts/guests/group/couple/europe/southern.json',
  'src/scripts/guests/group/couple/europe/western.json',
  'src/scripts/guests/group/couple/oceania/oceania.json',
];

const GUESTS_GROUP_FRIENDS_FILES = [
  'src/scripts/guests/group/friends/america/south.json',
  'src/scripts/guests/group/friends/asia/central.json',
  'src/scripts/guests/group/friends/asia/west.json',
  'src/scripts/guests/group/friends/europe/central.json',
  'src/scripts/guests/group/friends/europe/eastern.json',
  'src/scripts/guests/group/friends/europe/southern.json',
  'src/scripts/guests/group/friends/europe/western.json',
];

const GUESTS_GROUP_FAMILY_FILES = [
  'src/scripts/guests/group/family/america/caribbean.json',
  'src/scripts/guests/group/family/america/south.json',
];

const HOSTED_SOLO_FILES = [
  'src/scripts/hosted/solo/america/north.json',
  'src/scripts/hosted/solo/america/south.json',
  'src/scripts/hosted/solo/europe/western.json',
];

const HOSTED_GROUP_COUPLE_FILES = [
  'src/scripts/hosted/group/couple/america/central.json',
  'src/scripts/hosted/group/couple/america/north.json',
  'src/scripts/hosted/group/couple/america/south.json',
];

const HOSTED_GROUP_FRIENDS_FILES = ['src/scripts/hosted/group/friends/america/north.json'];

const PERSONAL_FILES = [
  'src/scripts/personal/america/central.json',
  'src/scripts/personal/america/north.json',
  'src/scripts/personal/america/south.json',
  'src/scripts/personal/asia/southeast.json',
  'src/scripts/personal/asia/west.json',
  'src/scripts/personal/europe/central.json',
];

dotenv.config();

const VALID_CONTINENTS = new Set<string>(CONTINENTS);
const VALID_REGIONS = new Set<string>(REGIONS);
const VALID_GENDERS = new Set<string>(GENDERS);
const VALID_GROUP_TYPES = new Set<string>(GROUP_TYPES);

function normalizeGroupType(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

function validateGuest(raw: any): void {
  const continent = raw.continent ? String(raw.continent).trim().toLowerCase() : null;
  const region = raw.region ? String(raw.region).trim().toLowerCase() : null;
  const groupType = normalizeGroupType(raw.groupType);
  const gender = raw.gender ? String(raw.gender).trim().toLowerCase() : null;
  const hometownCode = raw.hometownCode ? String(raw.hometownCode).trim().toUpperCase() : null;
  const countryCodeWeMet = raw.countryCodeWeMet ? String(raw.countryCodeWeMet).trim().toUpperCase() : null;
  const livingInCode = raw.livingInCode ? String(raw.livingInCode).trim().toUpperCase() : null;

  if (!continent || !VALID_CONTINENTS.has(continent))
    throw new Error(`Invalid continent "${raw.continent}" for "${raw.fullName}"`);

  if (!region || !VALID_REGIONS.has(region)) throw new Error(`Invalid region "${raw.region}" for "${raw.fullName}"`);
  if (!VALID_GROUP_TYPES.has(groupType)) throw new Error(`Invalid groupType "${raw.groupType}" for "${raw.fullName}"`);
  if (gender && !VALID_GENDERS.has(gender)) throw new Error(`Invalid gender "${raw.gender}" for "${raw.fullName}"`);
  if (hometownCode && !isValidAlpha3(hometownCode)) throw new Error(`Invalid hometownCode "${hometownCode}"`);

  if (countryCodeWeMet && !isValidAlpha3(countryCodeWeMet))
    throw new Error(`Invalid countryCodeWeMet "${countryCodeWeMet}"`);

  if (livingInCode && !isValidAlpha3(livingInCode)) throw new Error(`Invalid livingInCode "${livingInCode}"`);
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

// BUILDERS
function buildBaseGuest(raw: any) {
  const gender = raw.gender ? String(raw.gender).trim().toLowerCase() : 'trans';
  const continent = raw.continent ? String(raw.continent).trim().toLowerCase() : null;
  const region = raw.region ? String(raw.region).trim().toLowerCase() : null;

  return {
    guestId: nanoid(11),
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
    continent,
    region,
    fullName: raw.fullName ?? 'Unknown',
    hometown: nullify(raw.hometown),
    livingIn: nullify(raw.livingIn),
    cityWeMet: nullify(raw.cityWeMet),
    locationWeMet: nullify(raw.locationWeMet),
    birthDate: nullify(raw.birthDate),
    occupation: Array.isArray(raw.occupation) && raw.occupation.length ? raw.occupation : [],
    urlProfileCs: nullify(raw.urlProfileCs),
    gender,
    isGay: raw.isGay ?? false,
    whatsapp: nullify(raw.whatsapp),
    instagram: nullify(raw.instagram),
    theirReference: nullify(raw.theirReference),
    myReference: nullify(raw.myReference),
  };
}

function buildGuest(raw: any, groupIdMap: Map<string, string>) {
  validateGuest(raw);

  const groupType = normalizeGroupType(raw.groupType);
  let groupId: string | null = null;

  if (groupType !== 'solo' && raw.groupId != null) {
    const originalGroupId = String(raw.groupId);
    if (!groupIdMap.has(originalGroupId)) groupIdMap.set(originalGroupId, nanoid(11));
    groupId = groupIdMap.get(originalGroupId)!;
  }

  return {
    ...buildBaseGuest(raw),
    groupId,
    groupType,
  };
}

function buildHostedGuest(raw: any) {
  return {
    ...buildBaseGuest(raw),
    groupTypeCompanionship: raw.groupTypeCompanionship,
    companionshipMembers: raw.companionshipMembers ?? [],
  };
}

const HOSTED_DID_I_GO_WITH_FILES = 'src/scripts/hosted/group/companionship-members/companionship-members.json';

// GENERIC SEEDER
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

  if (documents.length > 0) await db.collection(collection).insertMany(documents);
  console.log(`✅ Inserted ${documents.length} documents into "${collection}"`);
}

// HOSTED SEEDER
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
  const companyData = loadJSONFile(companyFile);

  groupData.forEach((hosted) => {
    const groupTypeCompanionship = normalizeGroupType(hosted.groupTypeCompanionship);

    if (!groupTypeCompanionship) {
      throw new Error(
        `❌ "${hosted.fullName ?? 'Unknown'}" no tiene "groupTypeCompanionship". ` + `Debe verificar el archivo JSON.`
      );
    }

    const hasCompanionship = Array.isArray(hosted.companionship) && hosted.companionship.length > 0;
    const hasCompanionshipMembers = Array.isArray(hosted.companionshipMembers) && hosted.companionshipMembers.length > 0;

    if (hasCompanionship) {
      hosted.companionshipMembers = hosted.companionship.map((profileUrl: string) => {
        const company = companyData.find((company) => company.urlProfileCs === profileUrl);

        if (!company)
          throw new Error(
            `❌ No se encontró "${profileUrl}" en ` +
              `companionship-members.json para ` +
              `"${hosted.fullName ?? 'Unknown'}". ` +
              `Debe verificar el archivo JSON.`
          );

        return company;
      });
      return;
    }

    if (hasCompanionshipMembers) return;

    throw new Error(
      `❌ "${hosted.fullName ?? 'Unknown'}" tiene ` +
        `"groupTypeCompanionship": "${groupTypeCompanionship}", ` +
        `pero no tiene "companionship" ni "companionshipMembers" con datos. ` +
        `Debe verificar el archivo JSON.`
    );
  });

  const allData = [...soloData, ...groupData];
  console.log(`📦 Loaded ${allData.length} records`);

  const db = mongoose.connection.db;
  if (!db) throw new Error('No DB connection');

  await db.collection(collection).deleteMany({});
  console.log(`🗑️ Cleared "${collection}" collection`);

  const documents = allData.map((raw) => buildHostedGuest(raw));
  if (documents.length > 0) await db.collection(collection).insertMany(documents);
  console.log(`✅ Inserted ${documents.length} documents into "${collection}"`);
}

// ENV
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

const MONGO_URI = requireEnv('MONGO_URI');

// MAIN
async function seed() {
  console.log('🚀 Starting database seed...\n');

  await mongoose.connect(MONGO_URI);

  try {
    await seedCollection({
      collection: 'guests',
      soloFiles: GUESTS_SOLO_FILES,
      groupFiles: [...GUESTS_GROUP_COUPLE_FILES, ...GUESTS_GROUP_FRIENDS_FILES, ...GUESTS_GROUP_FAMILY_FILES],
    });

    await seedCollectionHosted({
      collection: 'hosted',
      soloFiles: HOSTED_SOLO_FILES,
      groupFiles: [...HOSTED_GROUP_COUPLE_FILES, ...HOSTED_GROUP_FRIENDS_FILES],
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
