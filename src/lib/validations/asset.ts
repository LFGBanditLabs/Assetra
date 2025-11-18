import { z } from 'zod';

export const createAssetSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(10).max(5000),
  assetType: z.enum(['REAL_ESTATE', 'COMMODITIES', 'ART', 'COLLECTIBLES', 'VEHICLES', 'OTHER']),
  assetValue: z.number().positive(),
  totalShares: z.number().int().positive(),
  ipfsHash: z.string().min(1),
  location: z.string().optional(),
  tokenId: z.number().int().nonnegative().optional(),
  contractAddress: z.string().optional(),
});

export const updateAssetSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().min(10).max(5000).optional(),
  assetValue: z.number().positive().optional(),
  status: z.enum(['PENDING', 'VERIFIED', 'ACTIVE', 'INACTIVE', 'REJECTED', 'REDEEMED']).optional(),
});

export const assetQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  assetType: z.enum(['REAL_ESTATE', 'COMMODITIES', 'ART', 'COLLECTIBLES', 'VEHICLES', 'OTHER']).optional(),
  status: z.enum(['PENDING', 'VERIFIED', 'ACTIVE', 'INACTIVE', 'REDEEMED']).optional(),
  search: z.string().optional(),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type AssetQueryInput = z.infer<typeof assetQuerySchema>;
