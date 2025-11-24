export type ViewType = 'GRID' | 'LIST'
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
  // Marketplace specific fields
  pricePerShare?: string
  marketCap?: string
  volume24h?: string
  priceChange24h?: string
  yieldPotential?: string
  isVerified?: boolean
  verificationDate?: string | null
  riskRating?: 'LOW' | 'MEDIUM' | 'HIGH'
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

// Marketplace specific types
export interface AssetOrder {
  id: string
  assetId: string
  userId: string
  type: 'BUY' | 'SELL'
  amount: number
  pricePerShare: string
  totalPrice: string
  status: 'ACTIVE' | 'FILLED' | 'CANCELLED' | 'PARTIALLY_FILLED'
  createdAt: string
  updatedAt: string
  expiresAt?: string | null
}

export interface AssetOffer {
  id: string
  assetId: string
  buyerId: string
  sellerId?: string | null
  amount: number
  offerPricePerShare: string
  totalOfferPrice: string
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED'
  message?: string | null
  createdAt: string
  expiresAt: string
  responseAt?: string | null
}

export interface MarketplaceFilters {
  assetType?: AssetType[]
  status?: AssetStatus[]
  location?: string[]
  priceRange?: {
    min: number
    max: number
  }
  yieldRange?: {
    min: number
    max: number
  }
  riskRating?: ('LOW' | 'MEDIUM' | 'HIGH')[]
  verificationStatus?: ('VERIFIED' | 'UNVERIFIED')[]
  sortBy?: 'PRICE' | 'VOLUME' | 'YIELD' | 'CREATED_AT' | 'MARKET_CAP'
  sortOrder?: 'ASC' | 'DESC'
  viewType?: 'GRID' | 'LIST'
}

