import { z } from 'zod';

const continentEnum = z.enum(['Africa', 'America', 'Europe', 'Asia', 'Oceania']);
const regionEnum = z.enum([
  'North America',
  'Central America',
  'South America',
  'Caribe',
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
const currentYear = new Date().getFullYear();

// visitedDate: accepts "Month Year" or "DD Month Year"
const visitedDateRegex = /^(\d{1,2}\s+)?[A-Za-z]+\s+\d{4}$/;

const individualInfoSchema = z.object({
  rating: z.number().int().min(1).max(5).nullable().optional().default(null),
  countryCode: z.string().min(2).max(4).toUpperCase(),
  prefixCode: z.string().nullable().optional().default(null),
  continent: continentEnum,
  region: regionEnum,
  fullName: z.string().min(1).max(200),
  birthplace: z.string().max(200).nullable().optional().default(null),
  livingIn: z.string().max(200).nullable().optional().default(null),
  birthyear: z.number().int().min(1900).max(currentYear).nullable().optional().default(null),
  occupation: z.array(z.string().max(100)).optional().default([]),
  urlProfileCs: z.union([z.string(), z.number()]).nullable().optional().default(null),
  gender: genderEnum,
  whatsapp: z.string().max(20).nullable().optional().default(null),
  instagram: z.string().max(100).nullable().optional().default(null),
});

const visitFields = {
  nights: z.number().int().min(1, 'nights must be at least 1'),
  stayed: z.boolean(),
  didWeHangOut: z.boolean(),
  visitedDate: z
    .string()
    .regex(visitedDateRegex, 'visitedDate must be "Month Year" or "DD Month Year" e.g. "November 2025" or "08 June 2026"'),
  isFirstTime: z.boolean().optional().default(false),
  gift: z.array(z.string().max(200)).nullable().optional().default(null),
  comments: z.string().max(2000).nullable().optional().default(null),
};

export const createSoloGuestSchema = z.object({
  ...visitFields,
  wasACouple: z.literal(false).optional().default(false),
  ...individualInfoSchema.shape,
});

export const createCoupleGuestSchema = z.object({
  ...visitFields,
  wasACouple: z.literal(true),
  coupleInfo: z.array(individualInfoSchema).length(2, 'coupleInfo must contain exactly 2 members'),
});

export const createGuestSchema = z.discriminatedUnion('wasACouple', [
  createSoloGuestSchema.extend({ wasACouple: z.literal(false) }),
  createCoupleGuestSchema,
]);

export const updateSoloGuestSchema = createSoloGuestSchema.partial();
export const updateCoupleGuestSchema = createCoupleGuestSchema.partial();
export const updateGuestSchema = z.union([updateSoloGuestSchema, updateCoupleGuestSchema]);

export const guestQuerySchema = z.object({
  page: z.string().regex(/^\d+$/).optional().default('1'),
  limit: z.string().regex(/^\d+$/).optional().default('10'),
  continent: continentEnum.optional(),
  region: regionEnum.optional(),
  isFirstTime: z.enum(['true', 'false']).optional(),
  from: z
    .string()
    .regex(/^[a-z]+-\d{4}$/i, 'format: month-year e.g. november-2022')
    .optional(),
  to: z
    .string()
    .regex(/^[a-z]+-\d{4}$/i, 'format: month-year e.g. august-2025')
    .optional(),
});

export type CreateGuestInput = z.infer<typeof createGuestSchema>;
export type UpdateGuestInput = z.infer<typeof updateGuestSchema>;
export type GuestQueryInput = z.infer<typeof guestQuerySchema>;
