import { apiFetch } from '@/lib/services/httpClient'

export interface TransactionQueryParams {
  page?: number
  limit?: number
  type?: string
  status?: string
}

interface IdentityHeaders {
  userId?: string
  walletAddress?: string
  email?: string
}

function buildIdentityHeaders(identity?: IdentityHeaders) {
  if (!identity) return {}
  const headers: Record<string, string> = {}
  if (identity.userId) headers['x-user-id'] = identity.userId
  if (identity.walletAddress) headers['x-wallet-address'] = identity.walletAddress
  if (identity.email) headers['x-user-email'] = identity.email
  return headers
}

export async function listTransactions(params: TransactionQueryParams = {}) {
  const searchParams = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  })

  const queryString = searchParams.toString()
  const url = queryString ? `/api/transactions?${queryString}` : '/api/transactions'

  return apiFetch<{
    transactions: any[]
    pagination: { page: number; limit: number; total: number; totalPages: number }
  }>(url)
}

export async function createTransaction(
  payload: { txHash: string; type: string; amount: number; assetId?: string },
  identity?: IdentityHeaders,
) {
  return apiFetch(`/api/transactions`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: buildIdentityHeaders(identity),
  })
}

