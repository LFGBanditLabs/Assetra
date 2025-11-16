import { z } from 'zod';

export const createTransactionSchema = z.object({
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'Invalid transaction hash'),
  type: z.enum(['MINT', 'TRANSFER', 'BURN', 'PURCHASE', 'SALE', 'REVENUE_CLAIM']),
  amount: z.number().positive(),
  assetId: z.string().uuid().optional(),
});

export const transactionQuerySchema = z.object({
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('10').transform(Number),
  type: z.enum(['MINT', 'TRANSFER', 'BURN', 'PURCHASE', 'SALE', 'REVENUE_CLAIM']).optional(),
  status: z.enum(['PENDING', 'CONFIRMED', 'FAILED']).optional(),
});

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type TransactionQueryInput = z.infer<typeof transactionQuerySchema>;
