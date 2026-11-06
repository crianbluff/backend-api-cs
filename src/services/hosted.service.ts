import { FilterQuery, Model } from 'mongoose';
import { HostedModel, IHostedDocument } from '../models/hosted.model';
import { generateGuestId } from '../utils/nanoid';
import { CreateHostedInput, HostedQueryInput, UpdateHostedInput } from '../utils/validation';
import { PaginatedResponse, YearlyStat } from '../types/api-response.types';
import { buildVisitedDateFilter, completeMonthlyStats, parsePagination } from '../utils/api-response';

// Types
export type HostedLean = Omit<IHostedDocument, keyof import('mongoose').Document>;

// Filters
function buildFilter(query: HostedQueryInput): FilterQuery<IHostedDocument> {
  const filter: FilterQuery<IHostedDocument> = {};

  if (query.continent?.length) filter.continent = { $in: query.continent };
  if (query.region?.length) filter.region = { $in: query.region };
  if (query.country?.length) filter.hometownCode = { $in: query.country };
  if (query.groupTypeCompanionship?.length) filter.groupTypeCompanionship = { $in: query.groupTypeCompanionship };
  if (query.countryCodeWeMet?.length) filter.countryCodeWeMet = { $in: query.countryCodeWeMet };
  if (query.gender) filter.gender = query.gender;
  if (query.gay !== undefined) filter.isGay = query.gay === 'true';
  if (query.isFirstTime !== undefined) filter.isFirstTime = query.isFirstTime === 'true';
  if (query.ambassador !== undefined) filter.ambassador = query.ambassador === 'true';
  if (query.hangOut !== undefined) filter.hangOut = query.hangOut === 'true';
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

    const [result] = await this.model
      .aggregate([
        {
          $match: filter,
        },
        {
          $sort: { visitedDate: -1 },
        },
        {
          $facet: {
            data: [{ $skip: skip }, { $limit: limit }],

            metadata: [{ $count: 'total' }],

            monthlyStats: [
              {
                $set: {
                  statsYear: {
                    $convert: {
                      input: {
                        $substr: [{ $ifNull: ['$visitedDate', ''] }, 0, 4],
                      },
                      to: 'int',
                      onError: null,
                      onNull: null,
                    },
                  },
                  statsMonth: {
                    $convert: {
                      input: {
                        $substr: [{ $ifNull: ['$visitedDate', ''] }, 5, 2],
                      },
                      to: 'int',
                      onError: null,
                      onNull: null,
                    },
                  },
                },
              },
              {
                $match: {
                  statsYear: { $ne: null },
                  statsMonth: { $gte: 1, $lte: 12 },
                },
              },
              {
                $group: {
                  _id: {
                    year: '$statsYear',
                    month: '$statsMonth',
                  },
                  total: { $sum: 1 },
                },
              },
              {
                $group: {
                  _id: '$_id.year',
                  months: {
                    $push: {
                      month: '$_id.month',
                      total: '$total',
                    },
                  },
                  total: { $sum: '$total' },
                },
              },
              { $sort: { _id: 1 } },
              {
                $project: {
                  _id: 0,
                  year: '$_id',
                  months: 1,
                  total: 1,
                },
              },
            ],
          },
        },
      ])
      .exec();

    const data = (result?.data ?? []) as HostedLean[];

    const total = result?.metadata?.[0]?.total ?? 0;
    const totalPages = Math.ceil(total / limit);

    const monthlyStats: YearlyStat[] = completeMonthlyStats(result?.monthlyStats ?? []);

    return {
      data,
      monthlyStats,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
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
