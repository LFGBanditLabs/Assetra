import { z } from 'zod'

export const documentTypeEnum = [
  'KYC_ID',
  'KYC_PROOF_ADDRESS',
  'ASSET_DEED',
  'ASSET_APPRAISAL',
  'LEGAL_AGREEMENT',
  'CERTIFICATE',
  'OTHER',
] as const

export const createDocumentSchema = z.object({
  name: z.string().min(1).max(255),
  type: z.enum(documentTypeEnum),
  ipfsHash: z.string().min(1),
  fileSize: z.number().int().nonnegative(),
  mimeType: z.string().min(1),
  assetId: z.string().uuid().optional(),
  expiresAt: z.string().datetime().optional(),
  version: z.number().int().positive().optional(),
})

export const documentQuerySchema = z.object({
  assetId: z.string().uuid().optional(),
  type: z.enum(documentTypeEnum).optional(),
  page: z.string().optional().default('1').transform(Number),
  limit: z.string().optional().default('20').transform(Number),
})

export const updateDocumentSchema = createDocumentSchema.partial()

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>
export type DocumentQueryInput = z.infer<typeof documentQuerySchema>

