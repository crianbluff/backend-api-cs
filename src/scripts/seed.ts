import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { nanoid } from 'nanoid';
import fs from 'fs';
import path from 'path';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI ?? 'mongodb://localhost:27017/guests_db';

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
 * ----------------------------
 */
function parseDateToISO(value: string | null | undefined): string | null {
  if (!value) return null;

  const s = String(value).trim();

  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    return new Date(s).toISOString().split('T')[0];
  }

  const d = new Date(s);
  if (!isNaN(d.getTime()) && isNaN(Number(s))) {
    return d.toISOString().split('T')[0];
  }

  if (/^\d{4}$/.test(s)) return s;

  return null;
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
 * BUILD DOCUMENT
 * ----------------------------
 */
function buildGuest(raw: any, groupId?: string) {
  return {
    guestId: nanoid(11),

    groupId,
    groupType: raw.groupType,

    nights: raw.nights,
    stayed: raw.stayed,
    hangOut: raw.hangOut ?? raw.didWeHangOut ?? false,

    visitedDate: parseDateToISO(raw.visitedDate),

    isFirstTime: raw.isFirstTime ?? false,

    gift: Array.isArray(raw.gift) && raw.gift.length > 0 ? raw.gift : null,

    comments: nullify(raw.comments),

    rating: raw.rating ?? null,

    hometownCode: raw.hometownCode,
    livingInCode: raw.livingInCode ?? null,
    prefixCode: raw.prefixCode ?? null,

    continent: raw.continent,
    region: raw.region,

    fullName: raw.fullName ?? 'Unknown',
    hometown: raw.hometown ?? null,
    livingIn: raw.livingIn ?? null,

    birthDate: parseDateToISO(raw.birthDate),

    occupation: Array.isArray(raw.occupation) ? raw.occupation : [],

    urlProfileCs: raw.urlProfileCs ?? null,

    gender: raw.gender ?? 'unknown',

    whatsapp: nullify(raw.whatsapp),
    instagram: nullify(raw.instagram),
  };
}

/**
 * ----------------------------
 * GROUP BY groupId
 * ----------------------------
 */
function groupByGroupId(all: any[]) {
  const map = new Map<string, any[]>();
  const singles: any[] = [];

  for (const item of all) {
    if (!item.groupId) {
      singles.push(buildGuest(item));
      continue;
    }

    const gid = String(item.groupId);

    if (!map.has(gid)) map.set(gid, []);
    map.get(gid)!.push(item);
  }

  const result: any[] = [...singles];

  for (const [groupId, members] of map.entries()) {
    for (const member of members) {
      result.push(buildGuest(member, groupId));
    }
  }

  return result;
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
  if (!db) throw new Error('No DB connection');

  await db.collection('guests').deleteMany({});
  console.log('🗑️ Cleared collection');

  const finalDocs = groupByGroupId(allData);

  await db.collection('guests').insertMany(finalDocs);

  console.log(`✅ Inserted ${finalDocs.length} documents`);

  await mongoose.disconnect();
  console.log('🏁 Done');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
