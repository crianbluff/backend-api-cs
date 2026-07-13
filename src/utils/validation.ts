import { z } from 'zod';
import { isValidAlpha3 } from './iso3166';

const continentEnum = z.enum(['africa', 'america', 'europe', 'asia', 'oceania']);

const regionEnum = z.enum([
  'north_america',
  'central_america',
  'south_america',
  'caribbean',
  'middle_east_asia',
  'southeast_asia',
  'eastern_asia',
  'south_asia',
  'central_asia',
  'west_europe',
  'scandinavia',
  'southern_europe',
  'northern_europe',
  'eastern_europe',
  'oceania',
  'africa',
]);

const genderEnum = z.enum(['male', 'female', 'trans']);
const groupTypeEnum = z.enum(['solo', 'couple', 'friends', 'family']);

// ISO 8601 flexible: "2026" | "2026-01" | "2026-01-05"
const isoDateRegex = /^\d{4}(-\d{2}(-\d{2})?)?$/;

const alpha3Schema = z
  .string()
  .min(3)
  .max(3)
  .toUpperCase()
  .refine((code) => isValidAlpha3(code), {
    message: 'Must be a valid ISO 3166-1 alpha-3 country code (e.g. "COL", "DEU", "JPN")',
  });

// ─── Individual fields (used for both solo and group members) ─────────────────

const individualSchema = z.object({
  rating: z.number().int().min(1).max(5).nullable().optional().default(null),
  hometownCode: alpha3Schema,
  livingInCode: alpha3Schema.nullable().optional().default(null),
  prefixCode: z.string().nullable().optional().default(null),
  continent: continentEnum,
  region: regionEnum,
  fullName: z.string().min(1).max(200),
  hometown: z.string().max(200).nullable().optional().default(null),
  livingIn: z.string().max(200).nullable().optional().default(null),
  birthDate: z
    .string()
    .regex(isoDateRegex, 'birthDate must be ISO 8601: "YYYY", "YYYY-MM" or "YYYY-MM-DD"')
    .nullable()
    .optional()
    .default(null),
  occupation: z.array(z.string().max(100)).optional().default([]),
  urlProfileCs: z.union([z.string(), z.number()]).nullable().optional().default(null),
  gender: genderEnum,
  whatsapp: z.string().max(20).nullable().optional().default(null),
  instagram: z.string().max(100).nullable().optional().default(null),
  // Per-member fields (also individual in groups)
  isFirstTime: z.boolean().optional().default(false),
  hangOut: z.boolean().optional().default(false),
  gift: z.array(z.string().max(200)).nullable().optional().default(null),
  comments: z.string().max(2000).nullable().optional().default(null),
});

// ─── Solo guest ───────────────────────────────────────────────────────────────

export const createSoloGuestSchema = z.object({
  nights: z.number().int().min(1, 'nights must be at least 1'),
  stayed: z.boolean(),
  visitedDate: z.string().regex(isoDateRegex, 'visitedDate must be ISO 8601: "YYYY", "YYYY-MM" or "YYYY-MM-DD"'),
  ...individualSchema.shape,
});

// ─── Group guest — shared fields + members array ──────────────────────────────

export const createGroupGuestSchema = z.object({
  nights: z.number().int().min(1, 'nights must be at least 1'),
  stayed: z.boolean(),
  visitedDate: z.string().regex(isoDateRegex, 'visitedDate must be ISO 8601: "YYYY", "YYYY-MM" or "YYYY-MM-DD"'),
  groupType: groupTypeEnum,
  members: z.array(individualSchema).min(2, 'A group must have at least 2 members').max(5),
});

// ─── Update schemas ───────────────────────────────────────────────────────────

export const updateSoloGuestSchema = createSoloGuestSchema.partial();
export const updateGroupGuestSchema = createGroupGuestSchema.partial();
export const updateGuestSchema = createSoloGuestSchema.partial();

// ─── Query params ─────────────────────────────────────────────────────────────

export const guestQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().default('1'),
  limit: z.string().regex(/^\d+$/).optional().default('10'),
  continent: continentEnum.optional(),
  region: regionEnum.optional(),
  country: z.string().min(3).max(3).toUpperCase().optional(),
  gender: genderEnum.optional(),
  groupType: z.enum(['couple', 'friends', 'family', 'solo']).optional(),
  isFirstTime: z.enum(['true', 'false']).optional(),
  from: z.string().regex(isoDateRegex, 'from must be ISO 8601: YYYY, YYYY-MM or YYYY-MM-DD').optional(),
  to: z.string().regex(isoDateRegex, 'to must be ISO 8601: YYYY, YYYY-MM or YYYY-MM-DD').optional(),
});

export type CreateSoloGuestInput = z.infer<typeof createSoloGuestSchema>;
export type CreateGroupGuestInput = z.infer<typeof createGroupGuestSchema>;
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>;
export type GuestQueryInput = z.infer<typeof guestQuerySchema>;
