import { z } from 'zod';

// Impact Levels
export const ImpactLevel = z.enum(['S', 'A', 'B', 'C']);
export type ImpactLevel = z.infer<typeof ImpactLevel>;

// Bias Types
export const Bias = z.enum(['Left', 'Center', 'Right']);
export type Bias = z.infer<typeof Bias>;

// Article Schema
export const ArticleSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1),
  url: z.string().url(),
  source: z.string().min(1),
  content: z.string(),
  publishedAt: z.coerce.date(),
  imageUrl: z.string().url().nullable(),
  summary: z.array(z.string().max(100)).max(3),
  sentiment: z.number().min(-1).max(1).nullable(),
  bias: Bias.nullable(),
  impactLevel: ImpactLevel,
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type Article = z.infer<typeof ArticleSchema>;

// Alert Schema
export const AlertSchema = z.object({
  id: z.string().uuid(),
  keyword: z.string().min(1).max(50),
  minImpact: ImpactLevel,
  notifyPush: z.boolean(),
  notifyEmail: z.boolean(),
  notifyDiscord: z.boolean(),
  isActive: z.boolean(),
  createdAt: z.coerce.date(),
  userId: z.string().uuid(),
});

export type Alert = z.infer<typeof AlertSchema>;

// User Schema
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().nullable(),
  language: z.enum(['ja', 'en']),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type User = z.infer<typeof UserSchema>;

// Stock Price Schema
export const StockPriceSchema = z.object({
  id: z.string().uuid(),
  symbol: z.string(),
  price: z.number().positive(),
  change: z.number(),
  volume: z.bigint(),
  timestamp: z.coerce.date(),
});

export type StockPrice = z.infer<typeof StockPriceSchema>;

// Trump Index Data Point
export const TrumpIndexDataPointSchema = z.object({
  time: z.string(),
  sentiment: z.number().min(-1).max(1),
  articleCount: z.number().int().nonnegative(),
});

export type TrumpIndexDataPoint = z.infer<typeof TrumpIndexDataPointSchema>;

// API Response Types
export const PaginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: z.array(itemSchema),
    total: z.number().int().nonnegative(),
    page: z.number().int().positive(),
    pageSize: z.number().int().positive(),
    hasMore: z.boolean(),
  });

export type PaginatedResponse<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
};

// Create Alert Input
export const CreateAlertInputSchema = z.object({
  keyword: z.string().min(1).max(50),
  minImpact: ImpactLevel,
  notifyPush: z.boolean().default(true),
  notifyEmail: z.boolean().default(false),
  notifyDiscord: z.boolean().default(false),
});

export type CreateAlertInput = z.infer<typeof CreateAlertInputSchema>;
