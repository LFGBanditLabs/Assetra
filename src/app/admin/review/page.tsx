'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listAssets, updateAsset } from '@/lib/services/assets'
import { getAsset } from '@/lib/services/assets'
import { sendWorkflowEmail } from '@/lib/services/notifications'
import { createTransaction } from '@/lib/services/transactions'
import { Asset, AssetStatus } from '@/types/asset'
import { WorkflowStage, WorkflowStatus } from '@/components/tokenization/WorkflowStatus'
import { ArrowRight, Check, FileBadge, Loader2, Mail, ShieldAlert, ShieldCheck } from 'lucide-react'

const statusToWorkflowStage: Record<AssetStatus, WorkflowStage> = {
  PENDING: 'UNDER_REVIEW',
  VERIFIED: 'APPROVED',
  ACTIVE: 'MINTED',
  INACTIVE: 'REQUEST_CHANGES',
  REJECTED: 'REQUEST_CHANGES',
  REDEEMED: 'MINTED',
}

const ADMIN_WALLET = process.env.NEXT_PUBLIC_ADMIN_WALLET_ADDRESS ?? '0x0000000000000000000000000000000000000AAA'

export default function AdminReviewPage() {
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null)
  const [infoMessage, setInfoMessage] = useState('')
  const queryClient = useQueryClient()

  const { data: assetsData, isLoading } = useQuery({
    queryKey: ['admin-assets'],
    queryFn: () => listAssets({ limit: 100 }),
  })

  const pendingAssets = useMemo(
    () => (assetsData?.assets ?? []).filter((asset) => asset.status === 'PENDING'),
    [assetsData?.assets],
  )

  const { data: selectedAssetData, isLoading: isLoadingAsset } = useQuery({
    queryKey: ['asset-detail', activeAssetId],
    queryFn: () => (activeAssetId ? getAsset(activeAssetId) : Promise.resolve(null)),
    enabled: Boolean(activeAssetId),
  })

  const selectedAsset = selectedAssetData?.asset

  const updateStatusMutation = useMutation({
    mutationFn: ({ assetId, status }: { assetId: string; status: AssetStatus }) =>
      updateAsset(assetId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-assets'] })
      if (activeAssetId) {
        queryClient.invalidateQueries({ queryKey: ['asset-detail', activeAssetId] })
      }
    },
  })

  const deploymentMutation = useMutation({
    mutationFn: async (asset: Asset) => {
      await updateAsset(asset.id, { status: 'ACTIVE' })
      await createTransaction(
        {
          txHash: `0x${crypto.randomUUID().replace(/-/g, '').padEnd(64, '0')}`,
          type: 'MINT',
          amount: Number(asset.assetValue ?? 0),
          assetId: asset.id,
        },
        { walletAddress: ADMIN_WALLET },
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-assets'] })
      if (activeAssetId) {
        queryClient.invalidateQueries({ queryKey: ['asset-detail', activeAssetId] })
      }
    },
  })

  const infoRequestMutation = useMutation({
    mutationFn: ({ asset, message }: { asset: Asset; message: string }) => {
      const recipient = asset.owner?.walletAddress
        ? `${asset.owner.walletAddress.slice(0, 6)}@notifications.assetra.xyz`
        : 'owner@assetra.xyz'
      return sendWorkflowEmail({
        to: recipient,
        subject: `Assetra review request for ${asset.name}`,
        html: `<p>We need additional information for <strong>${asset.name}</strong>.</p><p>${message}</p>`,
        stage: 'REQUEST_CHANGES',
      })
    },
    onSuccess: () => setInfoMessage(''),
  })

  return (
    <div className="bg-gray-50 px-4 py-10 md:px-8">
      <div className="rounded-3xl bg-gradient-to-r from-black to-gray-900 p-10 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-white/70">Compliance Console</p>
        <h1 className="mt-3 text-4xl font-semibold">Review & approve tokenization requests</h1>
        <p className="mt-4 text-white/80">
          Validate documentation, request clarifications, and trigger on-chain deployment with one click.
        </p>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[320px,1fr]">
        <aside className="space-y-4 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Pending submissions</h2>
          {isLoading && <Loader2 className="h-5 w-5 animate-spin text-gray-400" />}
          <ul className="space-y-3">
            {pendingAssets.map((asset) => (
              <li key={asset.id}>
                <button
                  type="button"
                  onClick={() => setActiveAssetId(asset.id)}
                  className={`w-full rounded-2xl border px-4 py-3 text-left ${
                    activeAssetId === asset.id ? 'border-black bg-black text-white' : 'border-gray-200 bg-white'
                  }`}
                >
                  <p className="font-semibold">{asset.name}</p>
                  <p className="text-xs opacity-70">{asset.owner?.walletAddress}</p>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          {!activeAssetId && <p className="text-gray-500">Select a submission to start reviewing.</p>}

          {activeAssetId && (
            <>
              {isLoadingAsset && <Loader2 className="h-5 w-5 animate-spin text-gray-400" />}

              {selectedAsset && (
                <div className="space-y-6">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-sm uppercase tracking-wide text-gray-400">Asset under review</p>
                      <h2 className="text-3xl font-semibold">{selectedAsset.name}</h2>
                      <p className="text-gray-500">{selectedAsset.description}</p>
                    </div>
                    <div className="rounded-2xl border border-gray-200 p-4 text-sm">
                      <p className="font-semibold">Valuation</p>
                      <p className="text-2xl font-bold">${Number(selectedAsset.assetValue ?? 0).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">
                        Shares {selectedAsset.totalShares} • Requested {selectedAsset.assetType}
                      </p>
                    </div>
                  </div>

                  <WorkflowStatus currentStage={statusToWorkflowStage[selectedAsset.status]} />

                  <div className="rounded-2xl border border-gray-200 p-6">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                      <FileBadge className="h-5 w-5" /> Document vault
                    </h3>
                    <ul className="mt-4 space-y-3">
                      {selectedAsset.documents?.map((doc) => (
                        <li key={doc.id} className="flex items-center justify-between rounded-xl border border-gray-100 px-4 py-3 text-sm">
                          <div>
                            <p className="font-semibold">{doc.name}</p>
                            <p className="text-xs text-gray-500">
                              {doc.type} • v{doc.version} • {new Date(doc.uploadedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <a
                            href={`https://ipfs.io/ipfs/${doc.ipfsHash}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-black"
                          >
                            Open <ArrowRight className="h-3 w-3" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-4 rounded-2xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold">Review actions</h3>
                    <textarea
                      value={infoMessage}
                      onChange={(event) => setInfoMessage(event.target.value)}
                      placeholder="Request additional information or corrections..."
                      className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm"
                      rows={3}
                    />
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        disabled={!infoMessage || infoRequestMutation.isLoading}
                        onClick={() =>
                          selectedAsset &&
                          infoRequestMutation.mutate({
                            asset: selectedAsset,
                            message: infoMessage,
                          })
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-5 py-2 text-sm font-semibold disabled:opacity-50"
                      >
                        <Mail className="h-4 w-4" />
                        Request info
                      </button>
                      <button
                        type="button"
                        onClick={() => selectedAsset && updateStatusMutation.mutate({ assetId: selectedAsset.id, status: 'VERIFIED' })}
                        className="inline-flex items-center gap-2 rounded-full border border-green-200 bg-green-50 px-5 py-2 text-sm font-semibold text-green-700"
                      >
                        <Check className="h-4 w-4" />
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => selectedAsset && updateStatusMutation.mutate({ assetId: selectedAsset.id, status: 'REJECTED' })}
                        className="inline-flex items-center gap-2 rounded-full border border-red-200 bg-red-50 px-5 py-2 text-sm font-semibold text-red-700"
                      >
                        <ShieldAlert className="h-4 w-4" />
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={deploymentMutation.isLoading}
                        onClick={() => selectedAsset && deploymentMutation.mutate(selectedAsset)}
                        className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Trigger deployment
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  )
}

