import { FilterQuery } from 'mongoose';
import { GuestModel, IGuestDocument } from '../models/guest.model';
import { generateGuestId, generateCoupleId } from '../utils/nanoid';
import { parseVisitedDate, parseMonthYearParam } from '../utils/visitedDate';
import { PaginatedResponse, GuestListItem, Gender } from '../types/guest.types';
import { CreateGuestInput, UpdateGuestInput, GuestQueryInput } from '../utils/validation';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcAge(birthyear: number | null | undefined): number | null {
  if (!birthyear || birthyear === 0) return null;
  return new Date().getFullYear() - birthyear;
}

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
      visitedAt: doc['visitedAt'] as Date,
      didWeHangOut: doc['didWeHangOut'] as boolean,
      fullName: null,
      countryCode: null,
      prefixCode: null,
      age: null,
      occupation: null,
      livingIn: null,
      birthplace: null,
      rating: null,
      gender: null,
      whatsapp: null,
      coupleInfo: ci.map((m) => ({
        fullName: m['fullName'] as string,
        countryCode: m['countryCode'] as string,
        prefixCode: (m['prefixCode'] as string | null) ?? null,
        age: calcAge(m['birthyear'] as number | null),
        occupation: (m['occupation'] as string[]) ?? [],
        livingIn: (m['livingIn'] as string | null) ?? null,
        birthplace: (m['birthplace'] as string | null) ?? null,
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
    visitedAt: doc['visitedAt'] as Date,
    didWeHangOut: doc['didWeHangOut'] as boolean,
    fullName: (doc['fullName'] as string) ?? null,
    countryCode: (doc['countryCode'] as string) ?? null,
    prefixCode: (doc['prefixCode'] as string | null) ?? null,
    age: calcAge(doc['birthyear'] as number | null),
    occupation: (doc['occupation'] as string[]) ?? [],
    livingIn: (doc['livingIn'] as string | null) ?? null,
    birthplace: (doc['birthplace'] as string | null) ?? null,
    rating: (doc['rating'] as number | null) ?? null,
    gender: (doc['gender'] as Gender) ?? null,
    whatsapp: (doc['whatsapp'] as string | null) ?? null,
  };
}

function parsePagination(query: GuestQueryInput): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(query.page ?? '1', 10));
  const limit = Math.min(200, Math.max(1, parseInt(query.limit ?? '10', 10)));
  return { page, limit, skip: (page - 1) * limit };
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

  // Date range using visitedAt (native Date)
  if (query.from || query.to) {
    const dateFilter: Record<string, Date> = {};
    if (query.from) {
      const d = parseMonthYearParam(query.from);
      if (d) dateFilter['$gte'] = d;
    }
    if (query.to) {
      const d = parseMonthYearParam(query.to);
      if (d) {
        // Include the full month: advance to first day of next month
        dateFilter['$lt'] = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      }
    }
    if (Object.keys(dateFilter).length > 0) {
      filter.visitedAt = dateFilter as FilterQuery<IGuestDocument>['visitedAt'];
    }
  }

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
      visitedAt: 1,
      didWeHangOut: 1,
      fullName: 1,
      countryCode: 1,
      prefixCode: 1,
      birthyear: 1,
      occupation: 1,
      livingIn: 1,
      birthplace: 1,
      rating: 1,
      gender: 1,
      whatsapp: 1,
      'coupleInfo.fullName': 1,
      'coupleInfo.countryCode': 1,
      'coupleInfo.prefixCode': 1,
      'coupleInfo.birthyear': 1,
      'coupleInfo.occupation': 1,
      'coupleInfo.livingIn': 1,
      'coupleInfo.birthplace': 1,
      'coupleInfo.rating': 1,
      'coupleInfo.gender': 1,
      'coupleInfo.whatsapp': 1,
    };

    const [raw, total] = await Promise.all([
      GuestModel.find(filter, projection)
        .sort({ visitedAt: -1 }) // newest visitedDate first
        .skip(skip)
        .limit(limit)
        .lean(),
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
    const visitedAt = parseVisitedDate(input.visitedDate);

    if (input.wasACouple) {
      const doc = await GuestModel.create({
        guestId,
        coupleId: generateCoupleId(),
        nights: input.nights,
        stayed: input.stayed,
        didWeHangOut: input.didWeHangOut,
        visitedDate: input.visitedDate,
        visitedAt,
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
      didWeHangOut,
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
      didWeHangOut,
      visitedDate,
      visitedAt,
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

    // If visitedDate is being updated, recompute visitedAt
    const updatePayload: Record<string, unknown> = { ...input };
    if (input.visitedDate) {
      updatePayload['visitedAt'] = parseVisitedDate(input.visitedDate);
    }

    const updated = await GuestModel.findOneAndUpdate(
      { guestId },
      { $set: updatePayload },
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
