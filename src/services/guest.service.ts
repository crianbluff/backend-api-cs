const MAX_LIMIT_PER_PAG = 170;

import { FilterQuery, HydratedDocument } from 'mongoose';
import { Model } from 'mongoose';
import { GuestModel, IGuestDocument } from '../models/guest.model';
import { generateGuestId } from '../utils/nanoid';
import {
  PaginatedResponse,
  GuestListItem,
  SoloListItem,
  GroupListItem,
  GroupMemberListItem,
  Gender,
  Continent,
  Region,
  GroupType,
} from '../types/guest.types';
import { GuestQueryInput, UpdateGuestInput } from '../utils/validation';

/**
 * Base domain type (lo que realmente guardas en Mongo)
 */
export interface Guest {
  birthDate: string | null;
  comments: string | null;
  continent: Continent;
  fullName: string;
  gender: Gender;
  isGay: boolean;
  ambassador: boolean;
  theirReference: string | null;
  myReference: string | null;
  gift: string[] | null;
  groupId: string | null;
  groupType: GroupType;
  guestId: string;
  hangOut: boolean;
  hometown: string | null;
  hometownCode: string;
  instagram: string | null;
  isFirstTime: boolean;
  livingIn: string | null;
  livingInCode: string | null;
  nights: number;
  occupation: string[];
  prefixCode: string | null;
  rating: number | null;
  region: Region;
  stayed: boolean;
  urlProfileCs: string | null;
  visitedDate: string;
  whatsapp: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Mongoose document real
 */
export type GuestDoc = HydratedDocument<Guest>;

/**
 * Lean type (IMPORTANT: esto es lo que devuelve .lean())
 */
export type GuestLean = Guest;

function toMember(doc: GuestLean): GroupMemberListItem {
  return {
    guestId: doc.guestId,

    // Visit info (individual)
    hangOut: doc.hangOut,
    gift: doc.gift,
    comments: doc.comments,
    isFirstTime: doc.isFirstTime ?? false,
    ambassador: doc.ambassador,

    // Personal info
    fullName: doc.fullName ?? '',
    hometownCode: doc.hometownCode,
    livingInCode: doc.livingInCode,
    prefixCode: doc.prefixCode,
    continent: doc.continent,
    region: doc.region,
    birthDate: doc.birthDate,
    occupation: doc.occupation ?? [],
    hometown: doc.hometown,
    livingIn: doc.livingIn,
    rating: doc.rating,
    gender: doc.gender,
    isGay: doc.isGay,
    theirReference: doc.theirReference,
    myReference: doc.myReference,
    whatsapp: doc.whatsapp,
    instagram: doc.instagram,
    urlProfileCs: doc.urlProfileCs,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function toSolo(doc: GuestLean): SoloListItem {
  return {
    guestId: doc.guestId,
    groupType: 'solo',
    isFirstTime: doc.isFirstTime ?? false,
    ambassador: doc.ambassador ?? false,
    nights: doc.nights,
    stayed: doc.stayed,
    visitedDate: doc.visitedDate,
    hangOut: doc.hangOut,
    fullName: doc.fullName ?? '',
    hometownCode: doc.hometownCode,
    livingInCode: doc.livingInCode,
    prefixCode: doc.prefixCode,
    continent: doc.continent,
    region: doc.region,
    birthDate: doc.birthDate,
    occupation: doc.occupation ?? [],
    livingIn: doc.livingIn,
    hometown: doc.hometown,
    rating: doc.rating,
    gender: doc.gender,
    isGay: doc.isGay,
    theirReference: doc.theirReference,
    myReference: doc.myReference,
    whatsapp: doc.whatsapp,
    urlProfileCs: doc.urlProfileCs,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  };
}

function parsePagination(query: GuestQueryInput) {
  const page = Math.max(1, Number(query.page ?? 1));
  const limit = Math.min(MAX_LIMIT_PER_PAG, Math.max(1, parseInt(query.limit ?? '10', 10)));
  return { page, limit, skip: (page - 1) * limit };
}

function buildVisitedDateFilter(from?: string, to?: string): Record<string, unknown> {
  if (!from && !to) return {};
  // ISO 8601 string comparison works lexicographically for YYYY, YYYY-MM, YYYY-MM-DD
  const conditions: Record<string, string> = {};
  if (from) conditions['$gte'] = from;
  if (to) conditions['$lte'] = to;
  return { visitedDate: conditions };
}

function buildFilter(query: GuestQueryInput): FilterQuery<IGuestDocument> {
  const filter: FilterQuery<IGuestDocument> = {};

  if (query.continent) filter.continent = query.continent;
  if (query.region) filter.region = query.region;
  if (query.country) filter.hometownCode = query.country;
  if (query.gender) filter.gender = query.gender;

  if (query.groupType === 'solo') {
    filter.groupId = null;
  } else if (query.groupType) {
    filter.groupType = query.groupType;
  }

  if (query.isFirstTime !== undefined) filter.isFirstTime = query.isFirstTime === 'true';
  if (query.ambassador !== undefined) filter.ambassador = query.ambassador === 'true';

  const dateFilter = buildVisitedDateFilter(query.from, query.to);
  Object.assign(filter, dateFilter);

  return filter;
}

export class GuestService {
  constructor(protected readonly model: Model<IGuestDocument>) {}

  async findAll(query: GuestQueryInput): Promise<PaginatedResponse<GuestListItem>> {
    const { page, limit, skip } = parsePagination(query);
    const filter = buildFilter(query);

    const docs = await this.model
      .find(filter)
      .select('-theirReference -myReference')
      .sort({ visitedDate: -1 })
      .lean<GuestLean[]>()
      .exec();

    const groups = new Map<string, GroupListItem>();
    const result: GuestListItem[] = [];
    const seen = new Set<string>();

    for (const doc of docs) {
      if (!doc.groupId) {
        result.push(toSolo(doc));
        continue;
      }

      if (!doc.groupType) {
        throw new Error(`Missing groupType for groupId ${doc.groupId}`);
      }

      if (!groups.has(doc.groupId)) {
        groups.set(doc.groupId, {
          groupId: doc.groupId,
          groupType: doc.groupType,
          nights: doc.nights,
          stayed: doc.stayed,
          visitedDate: doc.visitedDate,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          members: [],
        });
      }

      groups.get(doc.groupId)!.members.push(toMember(doc));

      if (!seen.has(doc.groupId)) {
        seen.add(doc.groupId);
        result.push(groups.get(doc.groupId)!);
      }
    }

    const total = result.length;
    const totalPages = Math.ceil(total / limit);

    return {
      data: result.slice(skip, skip + limit),
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async findById(guestId: string): Promise<IGuestDocument | null> {
    return this.model.findOne({ guestId }).lean() as Promise<IGuestDocument | null>;
  }

  async createSolo(input: Record<string, unknown>): Promise<Omit<IGuestDocument, 'groupId'>> {
    const doc = await this.model.create({
      guestId: generateGuestId(),
      groupId: null,
      groupType: 'solo',
      ...input,
    });

    const raw = doc.toJSON() as Record<string, unknown>;
    // Remove groupId from solo response
    delete raw['groupId'];
    // delete raw['groupType'];
    return raw as unknown as Omit<IGuestDocument, 'groupId'>;
  }

  async update(guestId: string, input: UpdateGuestInput): Promise<GuestLean | null> {
    return this.model
      .findOneAndUpdate(
        { guestId },
        { $set: input },
        {
          new: true,
          runValidators: true,
        }
      )
      .lean<GuestLean>()
      .exec();
  }

  async delete(guestId: string): Promise<boolean> {
    const res = await this.model.deleteOne({ guestId });
    return res.deletedCount === 1;
  }
}

export const guestService = new GuestService(GuestModel);
