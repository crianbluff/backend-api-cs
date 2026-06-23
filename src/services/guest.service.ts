import { FilterQuery } from 'mongoose';
import { GuestModel, IGuestDocument } from '../models/guest.model';
import { generateGuestId, generateCoupleId } from '../utils/nanoid';
import { parseMonthYearParam } from '../utils/visitedDate';
import { PaginatedResponse, GuestListItem, Gender, Continent, Region } from '../types/guest.types';
import { CreateGuestInput, UpdateGuestInput, GuestQueryInput } from '../utils/validation';

// ─── Age helper ───────────────────────────────────────────────────────────────

function calcAge(birthDate: string | null | undefined): number | null {
  if (!birthDate) return null;
  // Extract the year — last token that looks like a 4-digit year
  const match = birthDate.match(/\b(\d{4})\b/);
  if (!match) return null;
  const year = parseInt(match[1], 10);
  if (isNaN(year)) return null;
  return new Date().getFullYear() - year;
}

// ─── List item projector ──────────────────────────────────────────────────────

function toListItem(doc: Record<string, unknown>): GuestListItem {
  const wasACouple = doc['wasACouple'] as boolean;

  if (wasACouple) {
    const ci = (doc['coupleInfo'] as Array<Record<string, unknown>>) ?? [];
    return {
      guestId: doc['guestId'] as string,
      wasACouple: true,
      isFirstTime: (doc['isFirstTime'] as boolean) ?? false,
      nights: doc['nights'] as number,
      stayed: doc['stayed'] as boolean,
      visitedDate: doc['visitedDate'] as string,
      hangOut: doc['hangOut'] as boolean,
      fullName: null,
      hometownCode: null,
      livingInCode: null,
      prefixCode: null,
      continent: null,
      region: null,
      age: null,
      occupation: null,
      livingIn: null,
      hometown: null,
      rating: null,
      gender: null,
      whatsapp: null,
      coupleInfo: ci.map((m) => ({
        fullName: m['fullName'] as string,
        hometownCode: m['hometownCode'] as string,
        livingInCode: (m['livingInCode'] as string | null) ?? null,
        prefixCode: (m['prefixCode'] as string | null) ?? null,
        continent: m['continent'] as Continent,
        region: m['region'] as Region,
        age: calcAge(m['birthDate'] as string | null),
        occupation: (m['occupation'] as string[]) ?? [],
        livingIn: (m['livingIn'] as string | null) ?? null,
        hometown: (m['hometown'] as string | null) ?? null,
        rating: (m['rating'] as number | null) ?? null,
        gender: m['gender'] as Gender,
        whatsapp: (m['whatsapp'] as string | null) ?? null,
      })),
    };
  }

  return {
    guestId: doc['guestId'] as string,
    wasACouple: false,
    isFirstTime: (doc['isFirstTime'] as boolean) ?? false,
    nights: doc['nights'] as number,
    stayed: doc['stayed'] as boolean,
    visitedDate: doc['visitedDate'] as string,
    hangOut: doc['hangOut'] as boolean,
    fullName: (doc['fullName'] as string) ?? null,
    hometownCode: (doc['hometownCode'] as string) ?? null,
    livingInCode: (doc['livingInCode'] as string | null) ?? null,
    prefixCode: (doc['prefixCode'] as string | null) ?? null,
    continent: (doc['continent'] as Continent) ?? null,
    region: (doc['region'] as Region) ?? null,
    age: calcAge(doc['birthDate'] as string | null),
    occupation: (doc['occupation'] as string[]) ?? [],
    livingIn: (doc['livingIn'] as string | null) ?? null,
    hometown: (doc['hometown'] as string | null) ?? null,
    rating: (doc['rating'] as number | null) ?? null,
    gender: (doc['gender'] as Gender) ?? null,
    whatsapp: (doc['whatsapp'] as string | null) ?? null,
  };
}

// ─── Filter builder ───────────────────────────────────────────────────────────

function parsePagination(query: GuestQueryInput): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(query.page ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '10', 10)));
  return { page, limit, skip: (page - 1) * limit };
}

function buildVisitedDateFilter(from?: string, to?: string): Record<string, unknown> {
  if (!from && !to) return {};

  const MONTHS = [
    'january',
    'february',
    'march',
    'april',
    'may',
    'june',
    'july',
    'august',
    'september',
    'october',
    'november',
    'december',
  ];

  const computedKey = {
    $let: {
      vars: { parts: { $split: ['$visitedDate', ' '] } },
      in: {
        $cond: {
          if: { $eq: [{ $size: '$$parts' }, 2] },
          then: {
            $add: [
              { $multiply: [{ $toInt: { $arrayElemAt: ['$$parts', 1] } }, 100] },
              { $add: [{ $indexOfArray: [MONTHS, { $toLower: { $arrayElemAt: ['$$parts', 0] } }] }, 1] },
            ],
          },
          else: {
            $add: [
              { $multiply: [{ $toInt: { $arrayElemAt: ['$$parts', 2] } }, 100] },
              { $add: [{ $indexOfArray: [MONTHS, { $toLower: { $arrayElemAt: ['$$parts', 1] } }] }, 1] },
            ],
          },
        },
      },
    },
  };

  const conditions: unknown[] = [];
  if (from) {
    const k = parseMonthYearParam(from);
    if (k !== null) conditions.push({ $gte: [computedKey, k] });
  }
  if (to) {
    const k = parseMonthYearParam(to);
    if (k !== null) conditions.push({ $lte: [computedKey, k] });
  }

  if (conditions.length === 0) return {};
  return { $expr: conditions.length === 1 ? conditions[0] : { $and: conditions } };
}

function buildFilter(query: GuestQueryInput): FilterQuery<IGuestDocument> {
  const filter: FilterQuery<IGuestDocument> = {};

  if (query.continent) {
    filter.$or = [{ continent: query.continent }, { 'coupleInfo.continent': query.continent }];
  }

  if (query.region) {
    filter.$or = [{ region: query.region }, { 'coupleInfo.region': query.region }];
  }

  if (query.isFirstTime !== undefined) {
    filter.isFirstTime = query.isFirstTime === 'true';
  }

  const dateFilter = buildVisitedDateFilter(query.from, query.to);
  Object.assign(filter, dateFilter);

  return filter;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class GuestService {
  async findAll(query: GuestQueryInput): Promise<PaginatedResponse<GuestListItem>> {
    const { page, limit, skip } = parsePagination(query);
    const filter = buildFilter(query);

    const projection = {
      guestId: 1,
      wasACouple: 1,
      isFirstTime: 1,
      nights: 1,
      stayed: 1,
      visitedDate: 1,
      hangOut: 1,
      // Solo
      fullName: 1,
      hometownCode: 1,
      livingInCode: 1,
      prefixCode: 1,
      continent: 1,
      region: 1,
      birthDate: 1,
      occupation: 1,
      livingIn: 1,
      hometown: 1,
      rating: 1,
      gender: 1,
      whatsapp: 1,
      // Couple
      'coupleInfo.fullName': 1,
      'coupleInfo.hometownCode': 1,
      'coupleInfo.livingInCode': 1,
      'coupleInfo.prefixCode': 1,
      'coupleInfo.continent': 1,
      'coupleInfo.region': 1,
      'coupleInfo.birthDate': 1,
      'coupleInfo.occupation': 1,
      'coupleInfo.livingIn': 1,
      'coupleInfo.hometown': 1,
      'coupleInfo.rating': 1,
      'coupleInfo.gender': 1,
      'coupleInfo.whatsapp': 1,
    };

    const [raw, total] = await Promise.all([
      GuestModel.find(filter, projection).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      GuestModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);
    const data = raw.map((doc) => toListItem(doc as unknown as Record<string, unknown>));
    return { data, total, page, limit, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 };
  }

  async findById(guestId: string): Promise<IGuestDocument | null> {
    return GuestModel.findOne({ guestId }).lean() as Promise<IGuestDocument | null>;
  }

  async create(input: CreateGuestInput): Promise<IGuestDocument> {
    const guestId = generateGuestId();

    if (input.wasACouple) {
      const doc = await GuestModel.create({
        guestId,
        coupleId: generateCoupleId(),
        nights: input.nights,
        stayed: input.stayed,
        hangOut: input.hangOut,
        visitedDate: input.visitedDate,
        isFirstTime: input.isFirstTime ?? false,
        gift: input.gift ?? null,
        comments: input.comments ?? null,
        wasACouple: true,
        coupleInfo: input.coupleInfo,
      });
      return doc.toJSON() as unknown as IGuestDocument;
    }

    const {
      wasACouple: _w,
      nights,
      stayed,
      hangOut,
      visitedDate,
      isFirstTime,
      gift,
      comments,
      ...individualFields
    } = input as Extract<CreateGuestInput, { wasACouple: false }>;

    const doc = await GuestModel.create({
      guestId,
      coupleId: null,
      nights,
      stayed,
      hangOut,
      visitedDate,
      isFirstTime: isFirstTime ?? false,
      gift: gift ?? null,
      comments: comments ?? null,
      wasACouple: false,
      ...individualFields,
    });

    return doc.toJSON() as unknown as IGuestDocument;
  }

  async update(guestId: string, input: UpdateGuestInput): Promise<IGuestDocument | null> {
    const existing = await GuestModel.findOne({ guestId });
    if (!existing) return null;

    if (input.wasACouple !== undefined && input.wasACouple !== existing.wasACouple) {
      throw new Error('Cannot change wasACouple after creation');
    }

    const updated = await GuestModel.findOneAndUpdate(
      { guestId },
      { $set: input },
      { new: true, runValidators: true }
    ).lean();

    return updated as unknown as IGuestDocument | null;
  }

  async delete(guestId: string): Promise<boolean> {
    const result = await GuestModel.deleteOne({ guestId });
    return result.deletedCount === 1;
  }
}

export const guestService = new GuestService();
