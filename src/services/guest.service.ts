import { FilterQuery } from 'mongoose';
import { GuestModel, IGuestDocument } from '../models/guest.model';
import { generateGuestId, generateCoupleId } from '../utils/nanoid';
import { buildDateRangeFilter } from '../utils/dateRange';
import { PaginatedResponse } from '../types/guest.types';
import { CreateGuestInput, UpdateGuestInput, GuestQueryInput } from '../utils/validation';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePagination(query: GuestQueryInput): { page: number; limit: number; skip: number } {
  const page = Math.max(1, parseInt(query.page ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(query.limit ?? '10', 10)));
  return { page, limit, skip: (page - 1) * limit };
}

function buildFilter(query: GuestQueryInput): FilterQuery<IGuestDocument> {
  const filter: FilterQuery<IGuestDocument> = {};

  if (query.country) {
    filter.$or = [
      { country: { $regex: query.country, $options: 'i' } },
      { 'coupleInfo.country': { $regex: query.country, $options: 'i' } },
    ];
  }

  if (query.continent) {
    filter.$or = [{ continent: query.continent }, { 'coupleInfo.continent': query.continent }];
  }

  const dateFilter = buildDateRangeFilter(query.from, query.to);
  Object.assign(filter, dateFilter);

  return filter;
}

// ─── Service ──────────────────────────────────────────────────────────────────

export class GuestService {
  /**
   * Retrieve all guests with pagination and filters.
   */
  async findAll(query: GuestQueryInput): Promise<PaginatedResponse<IGuestDocument>> {
    const { page, limit, skip } = parsePagination(query);
    const filter = buildFilter(query);

    const [data, total] = await Promise.all([
      GuestModel.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      GuestModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: data as unknown as IGuestDocument[],
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  /**
   * Find a single guest by its guestId.
   */
  async findById(guestId: string): Promise<IGuestDocument | null> {
    return GuestModel.findOne({ guestId }).lean() as Promise<IGuestDocument | null>;
  }

  /**
   * Create a new guest (solo or couple).
   */
  async create(input: CreateGuestInput): Promise<IGuestDocument> {
    const guestId = generateGuestId();

    if (input.wasACouple) {
      const coupleId = generateCoupleId();
      const doc = await GuestModel.create({
        guestId,
        coupleId,
        nights: input.nights,
        stayed: input.stayed,
        didWeHangOut: input.didWeHangOut,
        visitedMonth: input.visitedMonth,
        visitedYear: input.visitedYear,
        gift: input.gift ?? null,
        comments: input.comments ?? null,
        wasACouple: true,
        coupleInfo: input.coupleInfo,
      });
      return doc.toJSON() as unknown as IGuestDocument;
    }

    // Solo guest — spread individual fields at root level

    const {
      wasACouple: _w,
      nights,
      stayed,
      didWeHangOut,
      visitedMonth,
      visitedYear,
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
      visitedMonth,
      visitedYear,
      gift: gift ?? null,
      comments: comments ?? null,
      wasACouple: false,
      ...individualFields,
    });

    return doc.toJSON() as unknown as IGuestDocument;
  }

  /**
   * Update an existing guest by guestId.
   * Performs a partial update (only provided fields are changed).
   */
  async update(guestId: string, input: UpdateGuestInput): Promise<IGuestDocument | null> {
    const existing = await GuestModel.findOne({ guestId });
    if (!existing) return null;

    // Prevent switching wasACouple type via update
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

  /**
   * Delete a guest by guestId.
   * Returns true if deleted, false if not found.
   */
  async delete(guestId: string): Promise<boolean> {
    const result = await GuestModel.deleteOne({ guestId });
    return result.deletedCount === 1;
  }
}

export const guestService = new GuestService();
