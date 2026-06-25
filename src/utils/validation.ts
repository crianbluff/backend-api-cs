import { z } from 'zod';

const continentEnum = z.enum(['Africa', 'America', 'Europe', 'Asia', 'Oceania']);
const regionEnum = z.enum([
  'North America',
  'Central America',
  'South America',
  'Caribbean',
  'Middle East Asia',
  'Southeast Asia',
  'Eastern Asia',
  'South Asia',
  'Central Asia',
  'West Europe',
  'Scandinavia',
  'Southern Europe',
  'Northern Europe',
  'Eastern Europe',
  'Oceania',
  'Africa',
]);
const genderEnum = z.enum(['male', 'female', 'trans']);
const groupTypeEnum = z.enum(['solo', 'couple', 'friends', 'family']);

// ISO 8601 flexible: "2026" | "2026-01" | "2026-01-05"
const isoDateRegex = /^\d{4}(-\d{2}(-\d{2})?)?$/;

const individualSchema = z.object({
  rating: z.number().int().min(1).max(5).nullable().optional().default(null),
  hometownCode: z.string().min(2).max(4).toUpperCase(),
  livingInCode: z.string().min(2).max(4).toUpperCase().nullable().optional().default(null),
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
  isFirstTime: z.boolean().optional().default(false),
});

const sharedVisitFields = {
  nights: z.number().int().min(1, 'nights must be at least 1'),
  stayed: z.boolean(),
  hangOut: z.boolean(),
  visitedDate: z.string().regex(isoDateRegex, 'visitedDate must be ISO 8601: "YYYY", "YYYY-MM" or "YYYY-MM-DD"'),
  isFirstTime: z.boolean().optional().default(false),
  gift: z.array(z.string().max(200)).nullable().optional().default(null),
  comments: z.string().max(2000).nullable().optional().default(null),
};

export const createSoloGuestSchema = z.object({
  ...sharedVisitFields,
  ...individualSchema.shape,
});

export const createGroupGuestSchema = z.object({
  ...sharedVisitFields,
  groupType: groupTypeEnum,
  members: z.array(individualSchema).min(2, 'A group must have at least 2 members').max(10),
});

export const createGuestSchema = z.union([createGroupGuestSchema, createSoloGuestSchema]);

export const updateSoloGuestSchema = createSoloGuestSchema.partial();
export const updateGroupGuestSchema = createGroupGuestSchema.partial();
export const updateGuestSchema = z.union([updateSoloGuestSchema, updateGroupGuestSchema]);

// groupType in query now includes 'solo' to filter solo guests
export const guestQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().default('1'),
  limit: z.string().regex(/^\d+$/).optional().default('10'),
  continent: continentEnum.optional(),
  region: regionEnum.optional(),
  groupType: z.enum(['couple', 'friends', 'family', 'solo']).optional(),
  isFirstTime: z.enum(['true', 'false']).optional(),
  from: z
    .string()
    .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, 'from must be ISO 8601: YYYY, YYYY-MM or YYYY-MM-DD')
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}(-\d{2}(-\d{2})?)?$/, 'to must be ISO 8601: YYYY, YYYY-MM or YYYY-MM-DD')
    .optional(),
});

export type CreateSoloGuestInput = z.infer<typeof createSoloGuestSchema>;
export type CreateGroupGuestInput = z.infer<typeof createGroupGuestSchema>;
export type CreateGuestInput = z.infer<typeof createGuestSchema>;
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>;
export type GuestQueryInput = z.infer<typeof guestQuerySchema>;
