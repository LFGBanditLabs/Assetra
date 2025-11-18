import { apiFetch } from '@/lib/services/httpClient'
import { AssetDocument, DocumentType } from '@/types/asset'

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

export interface UploadDocumentParams {
  file: File
  type: DocumentType
  assetId?: string
  identity?: IdentityHeaders
}

export async function uploadDocumentToIpfs(file: File) {
  const form = new FormData()
  form.append('file', file, file.name)

  return apiFetch<{ cid: string; url: string }>(`/api/ipfs/upload`, {
    method: 'POST',
    body: form,
  })
}

export async function createDocumentRecord(
  payload: {
    name: string
    type: DocumentType
    ipfsHash: string
    fileSize: number
    mimeType: string
    assetId?: string
  },
  identity?: IdentityHeaders,
) {
  return apiFetch<{ document: AssetDocument }>(`/api/documents`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: buildIdentityHeaders(identity),
  })
}

export async function listDocuments(
  params: { assetId?: string; type?: DocumentType; page?: number; limit?: number } = {},
  identity?: IdentityHeaders,
) {
  const searchParams = new URLSearchParams()

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value))
    }
  })

  const queryString = searchParams.toString()
  const url = queryString ? `/api/documents?${queryString}` : '/api/documents'

  return apiFetch<{ documents: AssetDocument[] }>(url, {
    headers: buildIdentityHeaders(identity),
  })
}

export async function deleteDocument(documentId: string, identity?: IdentityHeaders) {
  return apiFetch<{ success: boolean }>(`/api/documents/${documentId}`, {
    method: 'DELETE',
    headers: buildIdentityHeaders(identity),
  })
}

