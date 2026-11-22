import { z } from 'zod';
import { CATEGORIES, CONDITIONS, CONTACT_METHODS, MAX_PHOTOS, MAX_PRICE, SORTS, STATUSES, TYPES } from '@/lib/catalog';

const text = (min: number, max: number) => z.string().trim().min(min).max(max);
const money = z.number().min(0).max(MAX_PRICE).refine((value) => Math.abs(value * 100 - Math.round(value * 100)) < 0.00001, 'Use up to two decimal places.');
const marketPrice = z.preprocess((value) => {
  if (value === '' || value == null) return undefined;
  return Number(value);
}, money.optional());

export const objectId = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid identifier.').toLowerCase();

export const searchSchema = z.object({
  q: text(0, 120).default(''),
  category: z.enum(CATEGORIES).optional(),
  condition: z.enum(CONDITIONS).optional(),
  min: marketPrice,
  max: marketPrice,
  sort: z.enum(SORTS).default('newest'),
  page: z.coerce.number().int().min(1).max(1000).default(1),
}).refine(({ min, max }) => min === undefined || max === undefined || min <= max, {
  path: ['max'], message: 'Maximum price must be at least the minimum price.',
});

export const sellerSchema = z.object({
  name: text(2, 70),
  campus: text(2, 80),
  bio: text(0, 400).default(''),
  contact: z.enum(CONTACT_METHODS),
});

export const listingSchema = z.object({
  name: text(3, 100),
  description: text(10, 2000),
  category: z.enum(CATEGORIES),
  condition: z.enum(CONDITIONS),
  type: z.enum(TYPES),
  price: money,
  keepPhotos: z.array(text(1, 180)).max(MAX_PHOTOS).default([]),
  profile: sellerSchema.optional(),
}).refine(({ type, price }) => type === 'For Sale' ? price > 0 : price === 0, {
  path: ['price'], message: 'Enter a positive price for a sale listing.',
});

export const listingStateSchema = z.union([
  z.object({ active: z.boolean() }).strict(),
  z.object({ status: z.enum(STATUSES) }).strict(),
]);

export const enquirySchema = z.object({
  buyerName: text(2, 70),
  message: text(5, 1600),
  amount: money.positive().nullable().default(null),
});

export const responseSchema = z.discriminatedUnion('status', [
  z.object({ status: z.literal('Replied'), response: text(2, 1600) }),
  z.object({ status: z.enum(['Accepted', 'Rejected']), response: text(0, 1600).default('') }),
]);

export const favoriteSchema = z.object({ saved: z.boolean() });
