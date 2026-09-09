import { FilterQuery, Model } from 'mongoose';
import { HostedModel, IHostedDocument } from '../models/hosted.model';
import { generateGuestId } from '../utils/nanoid';
import { CreateHostedInput, HostedQueryInput, UpdateHostedInput } from '../utils/validation';
import { PaginatedResponse } from '../types/api-response.types';
import { buildVisitedDateFilter, parsePagination } from '../utils/api-response';

// Types
export type HostedLean = Omit<IHostedDocument, keyof import('mongoose').Document>;

// Filters
function buildFilter(query: HostedQueryInput): FilterQuery<IHostedDocument> {
  const filter: FilterQuery<IHostedDocument> = {};

  if (query.continent) filter.continent = query.continent;
  if (query.region) filter.region = query.region;
  if (query.country) filter.hometownCode = query.country;
  if (query.countryCodeWeMet) filter.countryCodeWeMet = query.countryCodeWeMet;
  if (query.gender) filter.gender = query.gender;
  if (query.groupTypeCompanionship) filter.groupTypeCompanionship = query.groupTypeCompanionship;
  if (query.gay !== undefined) filter.isGay = query.gay === 'true';
  if (query.isFirstTime !== undefined) filter.isFirstTime = query.isFirstTime === 'true';
  if (query.ambassador !== undefined) filter.ambassador = query.ambassador === 'true';
  if (query.didTheyReq !== undefined) filter.didTheyReq = query.didTheyReq === 'true';
  if (query.rating !== undefined) filter.rating = Number(query.rating);
  Object.assign(filter, buildVisitedDateFilter(query.from, query.to));
  return filter;
}

// Service
export class HostedService {
  constructor(protected readonly model: Model<IHostedDocument>) {}

  async findAll(query: HostedQueryInput): Promise<PaginatedResponse<HostedLean>> {
    const { page, limit, skip } = parsePagination(query);
    const filter = buildFilter(query);

    const [data, total] = await Promise.all([
      this.model.find(filter).sort({ visitedDate: -1 }).skip(skip).limit(limit).lean<HostedLean[]>().exec(),
      this.model.countDocuments(filter).exec(),
    ]);

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

  async findById(guestId: string): Promise<HostedLean | null> {
    return this.model.findOne({ guestId }).lean<HostedLean>().exec();
  }

  async create(input: CreateHostedInput): Promise<HostedLean> {
    const doc = await this.model.create({
      guestId: generateGuestId(),
      ...input,
    });

    return doc.toJSON() as HostedLean;
  }

  async update(guestId: string, input: UpdateHostedInput): Promise<HostedLean | null> {
    return this.model
      .findOneAndUpdate(
        { guestId },
        { $set: input },
        {
          new: true,
          runValidators: true,
        }
      )
      .lean<HostedLean>()
      .exec();
  }

  async delete(guestId: string): Promise<boolean> {
    const result = await this.model.deleteOne({ guestId });
    return result.deletedCount === 1;
  }
}

// Default service
export const hostedService = new HostedService(HostedModel);
