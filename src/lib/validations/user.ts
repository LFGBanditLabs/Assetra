import { z } from 'zod';

export const createUserSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  email: z.string().email().optional(),
});

export const updateUserSchema = z.object({
  email: z.string().email().optional(),
  kycStatus: z.enum(['PENDING', 'VERIFIED', 'REJECTED', 'EXPIRED']).optional(),
  riskLevel: z.enum(['NONE', 'LOW', 'MEDIUM', 'HIGH', 'BLOCKED']).optional(),
  transactionLimit: z.number().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

export const walletSignatureSchema = z.object({
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  signature: z.string(),
  message: z.string(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type WalletSignatureInput = z.infer<typeof walletSignatureSchema>;
