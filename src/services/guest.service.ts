const MAX_LIMIT_PER_PAG = 170;

import { FilterQuery, HydratedDocument } from 'mongoose';
import { GuestModel } from '../models/guest.model';
import { generateGuestId, generateCoupleId } from '../utils/nanoid';
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
import { CreateGroupGuestInput, GuestQueryInput, UpdateGuestInput } from '../utils/validation';

/**
 * Base domain type (lo que realmente guardas en Mongo)
 */
export interface Guest {
  birthDate: string | null;
  comments: string | null;
  continent: Continent;
  fullName: string;
  gender: Gender;
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
    isFirstTime: doc.isFirstTime ?? false,
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
    whatsapp: doc.whatsapp,
    urlProfileCs: doc.urlProfileCs,
  };
}

function toSolo(doc: GuestLean): SoloListItem {
  return {
    guestId: doc.guestId,
    groupId: null,
    groupType: 'solo',
    isFirstTime: doc.isFirstTime ?? false,
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
    whatsapp: doc.whatsapp,
    urlProfileCs: doc.urlProfileCs,
  };
}

function parsePagination(query: GuestQueryInput) {
  const page = Math.max(1, Number(query.page ?? 1));
  const limit = Math.min(MAX_LIMIT_PER_PAG, Math.max(1, parseInt(query.limit ?? '10', 10)));
  return { page, limit, skip: (page - 1) * limit };
}

function buildFilter(query: GuestQueryInput): FilterQuery<Guest> {
  const filter: FilterQuery<Guest> = {};

  if (query.continent) filter.continent = query.continent;
  if (query.region) filter.region = query.region;
  if (query.groupType) filter.groupType = query.groupType;
  if (query.isFirstTime !== undefined) {
    filter.isFirstTime = query.isFirstTime === 'true';
  }

  return filter;
}

export class GuestService {
  async findAll(query: GuestQueryInput): Promise<PaginatedResponse<GuestListItem>> {
    const { page, limit, skip } = parsePagination(query);
    const filter = buildFilter(query);

    const docs = await GuestModel.find(filter).sort({ createdAt: -1 }).lean<GuestLean[]>().exec();

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
          hangOut: doc.hangOut,
          gift: doc.gift,
          comments: doc.comments,
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

  async findById(guestId: string): Promise<GuestDoc | null> {
    return GuestModel.findOne({ guestId }).exec();
  }

  async findByGroupId(groupId: string): Promise<GuestLean[]> {
    return GuestModel.find({ groupId }).lean<GuestLean[]>().exec();
  }

  async createSolo(input: Partial<Guest>): Promise<GuestDoc> {
    return GuestModel.create({
      guestId: generateGuestId(),
      groupId: null,
      groupType: 'solo',
      isFirstTime: false,
      ...input,
    });
  }

  async createGroup(input: CreateGroupGuestInput): Promise<GuestLean[]> {
    const groupId = generateCoupleId();

    const docs = await GuestModel.insertMany(
      input.members.map((m) => ({
        guestId: generateGuestId(),
        groupId,
        groupType: input.groupType,
        nights: input.nights,
        stayed: input.stayed,
        hangOut: input.hangOut,
        visitedDate: input.visitedDate,
        gift: input.gift ?? null,
        comments: input.comments ?? null,
        ...m,
        isFirstTime: m.isFirstTime ?? input.isFirstTime ?? false,
      }))
    );

    return docs.map((d) => d.toObject() as GuestLean);
  }

  async update(guestId: string, input: UpdateGuestInput): Promise<GuestLean | null> {
    return GuestModel.findOneAndUpdate({ guestId }, { $set: input }, { new: true }).lean<GuestLean>().exec();
  }

  async delete(guestId: string): Promise<boolean> {
    const res = await GuestModel.deleteOne({ guestId });
    return res.deletedCount === 1;
  }

  async deleteGroup(groupId: string): Promise<number> {
    const res = await GuestModel.deleteMany({ groupId });
    return res.deletedCount ?? 0;
  }
}

export const guestService = new GuestService();
