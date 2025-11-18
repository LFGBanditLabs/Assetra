export type AssetStatus = 'PENDING' | 'VERIFIED' | 'ACTIVE' | 'INACTIVE' | 'REJECTED' | 'REDEEMED'
export type AssetType = 'REAL_ESTATE' | 'COMMODITIES' | 'ART' | 'COLLECTIBLES' | 'VEHICLES' | 'OTHER'
export type DocumentType =
  | 'KYC_ID'
  | 'KYC_PROOF_ADDRESS'
  | 'ASSET_DEED'
  | 'ASSET_APPRAISAL'
  | 'LEGAL_AGREEMENT'
  | 'CERTIFICATE'
  | 'OTHER'

export interface AssetDocument {
  id: string
  name: string
  type: DocumentType
  ipfsHash: string
  fileSize: number
  mimeType: string
  version: number
  uploadedAt: string
  expiresAt?: string | null
  assetId?: string | null
}

export interface AssetTransaction {
  id: string
  txHash: string
  type: 'MINT' | 'TRANSFER' | 'BURN' | 'PURCHASE' | 'SALE' | 'REVENUE_CLAIM'
  status: 'PENDING' | 'CONFIRMED' | 'FAILED'
  amount: string
  timestamp: string
  gasUsed?: string | null
  blockNumber?: number | null
}

export interface AssetOwner {
  id: string
  walletAddress: string
}

export interface AssetShareholder {
  id: string
  amount: number
  purchasePrice: string
  currentValue: string
  user: {
    id: string
    walletAddress: string
  }
}

export interface Asset {
  id: string
  name: string
  description: string
  assetType: AssetType
  assetValue: string
  totalShares: number
  availableShares: number
  status: AssetStatus
  ipfsHash: string
  location?: string | null
  contractAddress: string
  tokenId?: number | null
  ownerId: string
  createdAt: string
  updatedAt: string
  owner?: AssetOwner
  shares?: AssetShareholder[]
  documents?: AssetDocument[]
  transactions?: AssetTransaction[]
}

export interface AssetPagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface PaginatedAssetsResponse {
  assets: Asset[]
  pagination: AssetPagination
}

