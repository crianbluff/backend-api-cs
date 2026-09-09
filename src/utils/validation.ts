import { z } from 'zod';
import { isValidAlpha3 } from './iso3166';
import { CONTINENTS, GENDERS, GROUP_TYPES, REGIONS } from '../types/global.types';

// Enums & shared primitives
const continentEnum = z.enum(CONTINENTS);
const regionEnum = z.enum(REGIONS);
const genderEnum = z.enum(GENDERS);
const groupTypeEnum = z.enum(GROUP_TYPES);

// ISO 8601 flexible:
// "2026" | "2026-01" | "2026-01-05"
const isoDateRegex = /^\d{4}(-\d{2}(-\d{2})?)?$/;
const isoDateSchema = z.string().regex(isoDateRegex, 'Date must be ISO 8601: "YYYY", "YYYY-MM" or "YYYY-MM-DD"');

const alpha3Schema = z
  .string()
  .length(3)
  .toUpperCase()
  .refine((code) => isValidAlpha3(code), {
    message: 'Must be a valid ISO 3166-1 alpha-3 country code (e.g. "COL", "DEU", "JPN")',
  });

const booleanQuerySchema = z.enum(['true', 'false']);
const ratingQuerySchema = z.string().regex(/^[1-5]$/, 'rating must be between 1 and 5');

const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).optional().default('1'),
  limit: z.string().regex(/^\d+$/).optional().default('10'),
});

// Individual guest

const individualSchema = z.object({
  guestId: z.string().optional(),
  rating: z.number().int().min(1).max(5).nullable().optional().default(null),
  hometownCode: alpha3Schema,
  countryCodeWeMet: alpha3Schema,
  livingInCode: alpha3Schema.nullable().optional().default(null),
  prefixCode: z.string().nullable().optional().default(null),
  continent: continentEnum,
  region: regionEnum,
  fullName: z.string().min(1).max(200),
  hometown: z.string().max(200).nullable().optional().default(null),
  livingIn: z.string().max(200).nullable().optional().default(null),
  cityWeMet: z.string().max(200).nullable().optional().default(null),
  locationWeMet: z.string().max(200).nullable().optional().default(null),
  birthDate: isoDateSchema.nullable().optional().default(null),
  occupation: z.array(z.string().max(100)).optional().default([]),
  urlProfileCs: z.union([z.string(), z.number()]).nullable().optional().default(null),
  gender: genderEnum,
  isGay: z.boolean().default(false),
  theirReference: z.string().max(500, 'theirReference cannot exceed 500 characters').nullable().optional(),
  myReference: z.string().max(500, 'myReference cannot exceed 500 characters').nullable().optional(),
  whatsapp: z.string().max(20).nullable().optional().default(null),
  instagram: z.string().max(100).nullable().optional().default(null),
  // Per-member fields
  isFirstTime: z.boolean().optional().default(false),
  ambassador: z.boolean().optional().default(false),
  didTheyReq: z.boolean().optional().default(false),
  hangOut: z.boolean().optional().default(false),
  gift: z.array(z.string().max(200)).nullable().optional().default(null),
  comments: z.string().max(2000).nullable().optional().default(null),
});

// Shared guest fields

const staySchema = z.object({
  nights: z.number().int().min(1, 'nights must be at least 1'),
  stayed: z.boolean(),
  visitedDate: isoDateSchema,
});

// Solo guest
export const createSoloGuestSchema = individualSchema.merge(staySchema);

// Group guest
export const createGroupGuestSchema = staySchema.extend({
  groupType: groupTypeEnum,
  members: z.array(individualSchema).min(2, 'A group must have at least 2 members').max(5),
});

// Update schemas
export const updateSoloGuestSchema = createSoloGuestSchema.partial();
export const updateGroupGuestSchema = createGroupGuestSchema.partial();
export const updateGuestSchema = createSoloGuestSchema.partial();

// Guest query params

const guestQueryFiltersSchema = z.object({
  continent: continentEnum.optional(),
  region: regionEnum.optional(),
  country: alpha3Schema.optional(),
  countryCodeWeMet: alpha3Schema.optional(),
  gender: genderEnum.optional(),
  groupType: groupTypeEnum.optional(),
  gay: booleanQuerySchema.optional(),
  isFirstTime: booleanQuerySchema.optional(),
  ambassador: booleanQuerySchema.optional(),
  didTheyReq: booleanQuerySchema.optional(),
  rating: ratingQuerySchema.optional(),
  from: isoDateSchema.optional().describe('Filter start date'),
  to: isoDateSchema.optional().describe('Filter end date'),
});

export const guestQuerySchema = paginationSchema.merge(guestQueryFiltersSchema);

// Hosted companionship member
const companionshipMemberSchema = individualSchema.pick({
  hometownCode: true,
  prefixCode: true,
  continent: true,
  region: true,
  fullName: true,
  gender: true,
  whatsapp: true,
  ambassador: true,
  isFirstTime: true,
  livingInCode: true,
  hometown: true,
  livingIn: true,
  urlProfileCs: true,
  instagram: true,
  birthDate: true,
});

// Hosted guest
const hostedBaseSchema = individualSchema.extend({
  nights: z.number().int().min(1, 'nights must be at least 1'),
  visitedDate: isoDateSchema,
  groupTypeCompanionship: groupTypeEnum,
  companionshipMembers: z.array(companionshipMemberSchema).max(4),
});

// Hosted validation helpers
const validateCompanionshipMembers = (
  data: {
    groupTypeCompanionship?: z.infer<typeof groupTypeEnum>;
    companionshipMembers?: z.infer<typeof companionshipMemberSchema>[];
  },
  ctx: z.RefinementCtx
) => {
  const { groupTypeCompanionship, companionshipMembers } = data;

  if (
    groupTypeCompanionship &&
    groupTypeCompanionship !== 'solo' &&
    companionshipMembers !== undefined &&
    companionshipMembers.length === 0
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      type: 'array',
      minimum: 1,
      inclusive: true,
      path: ['companionshipMembers'],
      message:
        `companionshipMembers must have at least 1 member ` + `when groupTypeCompanionship is "${groupTypeCompanionship}"`,
    });
  }
};

// Hosted create
export const createHostedSchema = hostedBaseSchema.superRefine((data, ctx) => {
  if (data.groupTypeCompanionship !== 'solo' && data.companionshipMembers.length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.too_small,
      type: 'array',
      minimum: 1,
      inclusive: true,
      path: ['companionshipMembers'],
      message:
        `companionshipMembers must have at least 1 member ` +
        `when groupTypeCompanionship is "${data.groupTypeCompanionship}"`,
    });
  }
});

// Hosted update
export const updateHostedSchema = hostedBaseSchema.partial().superRefine((data, ctx) => {
  validateCompanionshipMembers(data, ctx);
});

// Hosted query params
const hostedQueryFiltersSchema = z.object({
  continent: continentEnum.optional(),
  region: regionEnum.optional(),
  country: alpha3Schema.optional(),
  countryCodeWeMet: alpha3Schema.optional(),
  gender: genderEnum.optional(),
  groupTypeCompanionship: groupTypeEnum.optional(),
  gay: booleanQuerySchema.optional(),
  isFirstTime: booleanQuerySchema.optional(),
  ambassador: booleanQuerySchema.optional(),
  didTheyReq: booleanQuerySchema.optional(),
  rating: ratingQuerySchema.optional(),
  from: isoDateSchema.optional().describe('Filter start date'),
  to: isoDateSchema.optional().describe('Filter end date'),
});

export const hostedQuerySchema = paginationSchema.merge(hostedQueryFiltersSchema);

// Types
export type CreateSoloGuestInput = z.infer<typeof createSoloGuestSchema>;
export type CreateGroupGuestInput = z.infer<typeof createGroupGuestSchema>;
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>;
export type GuestQueryInput = z.infer<typeof guestQuerySchema>;
export type CreateHostedInput = z.infer<typeof createHostedSchema>;
export type UpdateHostedInput = z.infer<typeof updateHostedSchema>;
export type HostedQueryInput = z.infer<typeof hostedQuerySchema>;
