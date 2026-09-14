import { FilterQuery, HydratedDocument, Model } from 'mongoose';
import { GuestModel, IGuestDocument } from '../models/guest.model';
import { GuestDocument, GuestListItem, SoloListItem, GroupListItem, GroupMemberListItem } from '../types/guest.types';
import { UpdateGuestInput, GuestQueryInput } from '../utils/validation';
import { generateGuestId } from '../utils/nanoid';
import { PaginatedResponse } from '../types/api-response.types';
import { buildVisitedDateFilter, parsePagination } from '../utils/api-response';

// ─── Mongoose types ──────────────────────────────────────────────────────────
export type GuestDoc = HydratedDocument<IGuestDocument>;
export type GuestLean = GuestDocument;

// ─── Mappers ─────────────────────────────────────────────────────────────────
function toMember(doc: GuestLean): GroupMemberListItem {
  return {
    guestId: doc.guestId,

    // Visit info
    hangOut: doc.hangOut,
    gift: doc.gift,
    comments: doc.comments,
    isFirstTime: doc.isFirstTime,
    ambassador: doc.ambassador,
    didTheyReq: doc.didTheyReq,

    // Personal info
    fullName: doc.fullName,
    hometownCode: doc.hometownCode,
    countryCodeWeMet: doc.countryCodeWeMet,
    livingInCode: doc.livingInCode,
    prefixCode: doc.prefixCode,
    continent: doc.continent,
    region: doc.region,
    birthDate: doc.birthDate,
    occupation: doc.occupation,
    hometown: doc.hometown,
    livingIn: doc.livingIn,
    cityWeMet: doc.cityWeMet,
    locationWeMet: doc.locationWeMet,
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

    // Visit info
    isFirstTime: doc.isFirstTime,
    ambassador: doc.ambassador,
    didTheyReq: doc.didTheyReq,
    nights: doc.nights,
    stayed: doc.stayed,
    visitedDate: doc.visitedDate,
    hangOut: doc.hangOut,

    // Personal info
    fullName: doc.fullName,
    hometownCode: doc.hometownCode,
    countryCodeWeMet: doc.countryCodeWeMet,
    livingInCode: doc.livingInCode,
    prefixCode: doc.prefixCode,
    continent: doc.continent,
    region: doc.region,
    birthDate: doc.birthDate,
    occupation: doc.occupation,
    livingIn: doc.livingIn,
    cityWeMet: doc.cityWeMet,
    locationWeMet: doc.locationWeMet,
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

// ─── Filters ─────────────────────────────────────────────────────────────────
function buildFilter(query: GuestQueryInput): FilterQuery<IGuestDocument> {
  const filter: FilterQuery<IGuestDocument> = {};

  if (query.continent) filter.continent = query.continent;
  if (query.region) filter.region = query.region;
  if (query.country) filter.hometownCode = query.country;
  if (query.countryCodeWeMet) filter.countryCodeWeMet = query.countryCodeWeMet;
  if (query.gender) filter.gender = query.gender;

  if (query.groupType === 'solo') {
    filter.groupId = null;
  } else if (query.groupType) {
    filter.groupType = query.groupType;
  }

  if (query.gay !== undefined) filter.isGay = query.gay === 'true';
  if (query.isFirstTime !== undefined) filter.isFirstTime = query.isFirstTime === 'true';
  if (query.ambassador !== undefined) filter.ambassador = query.ambassador === 'true';
  if (query.hangOut !== undefined) filter.hangOut = query.hangOut === 'true';
  if (query.didTheyReq !== undefined) filter.didTheyReq = query.didTheyReq === 'true';
  if (query.rating !== undefined) filter.rating = Number(query.rating);
  Object.assign(filter, buildVisitedDateFilter(query.from, query.to));

  return filter;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class GuestService {
  constructor(protected readonly model: Model<IGuestDocument>) {}

  async findAll(query: GuestQueryInput): Promise<PaginatedResponse<GuestListItem>> {
    const { page, limit, skip } = parsePagination(query);
    const filter = buildFilter(query);

    const [result] = await this.model
      .aggregate([
        {
          $match: filter,
        },

        // Si estamos filtrando gays, cada guest debe ser un resultado independiente.
        // En cualquier otro caso:
        // - Solo = guestId
        // - Grupo = groupId
        {
          $set: {
            aggregationKey: query.gay === 'true' ? '$guestId' : { $ifNull: ['$groupId', '$guestId'] },
          },
        },

        // Agrupar según aggregationKey
        {
          $group: {
            _id: '$aggregationKey',
            groupId: { $first: '$groupId' },
            groupType: { $first: '$groupType' },
            nights: { $first: '$nights' },
            stayed: { $first: '$stayed' },
            visitedDate: { $first: '$visitedDate' },
            createdAt: { $first: '$createdAt' },
            updatedAt: { $first: '$updatedAt' },

            members: {
              $push: '$$ROOT',
            },
          },
        },

        // Más recientes primero
        {
          $sort: {
            visitedDate: -1,
            _id: 1,
          },
        },

        // Paginar y contar directamente en MongoDB
        {
          $facet: {
            data: [{ $skip: skip }, { $limit: limit }],
            metadata: [{ $count: 'total' }],
          },
        },
      ])
      .exec();

    const data: GuestListItem[] = [];

    for (const item of result?.data ?? []) {
      // Si estamos filtrando gays:
      // cada persona cuenta como un resultado individual,
      // aunque pertenezca al mismo grupo.
      if (query.gay === 'true') {
        data.push(toSolo(item.members[0]));
        continue;
      }

      // Solo
      if (!item.groupId) {
        data.push(toSolo(item.members[0]));
        continue;
      }

      // Grupo
      const group: GroupListItem = {
        groupId: item.groupId,
        groupType: item.groupType,
        nights: item.nights,
        stayed: item.stayed,
        visitedDate: item.visitedDate,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        members: item.members.map(toMember),
      };

      data.push(group);
    }

    const total = result?.metadata?.[0]?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  async findById(guestId: string): Promise<GuestLean | null> {
    return this.model.findOne({ guestId }).lean<GuestLean>().exec();
  }

  async createSolo(input: Record<string, unknown>): Promise<Omit<GuestLean, 'groupId'>> {
    const doc = await this.model.create({
      guestId: generateGuestId(),
      groupId: null,
      groupType: 'solo',
      ...input,
    });

    const { groupId: _groupId, ...guest } = doc.toJSON() as GuestLean;
    return guest;
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
    const result = await this.model.deleteOne({ guestId });

    return result.deletedCount === 1;
  }
}

export const guestService = new GuestService(GuestModel);
