import { apiFetch } from '@/lib/services/httpClient'
import { Asset, PaginatedAssetsResponse } from '@/types/asset'

export interface AssetQueryParams {
  page?: number
  limit?: number
  assetType?: string
  status?: string
  search?: string
}

export interface CreateAssetPayload {
  name: string
  description: string
  assetType: string
  assetValue: number
  totalShares: number
  ipfsHash: string
  location?: string
  tokenId?: number | null
  contractAddress?: string | null
}

export interface UpdateAssetPayload {
  name?: string
  description?: string
  assetValue?: number
  status?: string
  location?: string | null
}

interface IdentityHeaders {
  userId?: string
  walletAddress?: string
  email?: string
}

function buildIdentityHeaders(identity?: IdentityHeaders) {
  if (!identity) return {}

  const headers: Record<string, string> = {}

  if (identity.userId) {
    headers['x-user-id'] = identity.userId
  }

  if (identity.walletAddress) {
    headers['x-wallet-address'] = identity.walletAddress
  }

  if (identity.email) {
    headers['x-user-email'] = identity.email
  }

  return headers
}

export async function listAssets(params: AssetQueryParams = {}) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  })

  const queryString = searchParams.toString()
  const url = queryString ? `/api/assets?${queryString}` : '/api/assets'

  return apiFetch<PaginatedAssetsResponse>(url)
}

export async function getAsset(assetId: string) {
  return apiFetch<{ asset: Asset }>(`/api/assets/${assetId}`)
}

export async function createAsset(
  payload: CreateAssetPayload,
  identity?: IdentityHeaders,
) {
  return apiFetch<{ asset: Asset }>('/api/assets', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: buildIdentityHeaders(identity),
  })
}

export async function updateAsset(
  assetId: string,
  payload: UpdateAssetPayload,
  identity?: IdentityHeaders,
) {
  return apiFetch<{ asset: Asset }>(`/api/assets/${assetId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    headers: buildIdentityHeaders(identity),
  })
}

