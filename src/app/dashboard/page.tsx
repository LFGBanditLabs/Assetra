'use client'

import { ReactNode, useMemo, useState } from 'react'
import { useAccount } from 'wagmi'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { listAssets, updateAsset } from '@/lib/services/assets'
import { listDocuments } from '@/lib/services/documents'
import { listTransactions } from '@/lib/services/transactions'
import { Asset, AssetStatus } from '@/types/asset'
import { cn } from '@/lib/utils/cn'
import { ArrowUpRight, Coins, FileText, Loader2, RefreshCcw, ShieldCheck, Signal } from 'lucide-react'

const statusCopy: Record<AssetStatus, { label: string; color: string; description: string }> = {
  PENDING: { label: 'Pending Review', color: 'bg-amber-100 text-amber-700', description: 'Awaiting admin verification' },
  VERIFIED: { label: 'Verified', color: 'bg-blue-100 text-blue-700', description: 'Ready for deployment' },
  ACTIVE: { label: 'Active', color: 'bg-green-100 text-green-700', description: 'Token minted and trading' },
  INACTIVE: { label: 'Paused', color: 'bg-gray-200 text-gray-700', description: 'Trading paused' },
  REDEEMED: { label: 'Redeemed', color: 'bg-purple-100 text-purple-700', description: 'Asset lifecycle complete' },
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount()
  const queryClient = useQueryClient()
  const [lifecycleNote, setLifecycleNote] = useState<string | null>(null)

  const { data: assetsData, isLoading: assetsLoading } = useQuery({
    queryKey: ['assets'],
    queryFn: () => listAssets({ limit: 50 }),
  })

  const ownerAssets = useMemo(() => {
    if (!address) return []
    return (assetsData?.assets ?? []).filter(
      (asset) => asset.owner?.walletAddress?.toLowerCase() === address.toLowerCase(),
    )
  }, [assetsData?.assets, address])

  const { data: documentsData } = useQuery({
    queryKey: ['documents', address],
    queryFn: () =>
      listDocuments({}, {
        walletAddress: address ?? undefined,
      }),
    enabled: Boolean(address),
  })

  const { data: transactionsData } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => listTransactions({ limit: 10 }),
  })

  const ownerTransactions = useMemo(() => {
    if (!address) return []
    return (transactionsData?.transactions ?? []).filter(
      (tx: any) => tx.user?.walletAddress?.toLowerCase() === address.toLowerCase(),
    )
  }, [transactionsData?.transactions, address])

  const totalValuation = ownerAssets.reduce((acc, asset) => acc + Number(asset.assetValue ?? 0), 0)
  const totalRaised = ownerAssets.reduce((acc, asset) => {
    const soldShares = asset.totalShares - asset.availableShares
    return acc + soldShares * (Number(asset.assetValue ?? 0) / asset.totalShares || 0)
  }, 0)

  const updateAssetMutation = useMutation({
    mutationFn: ({ assetId, payload }: { assetId: string; payload: Partial<Asset> }) =>
      updateAsset(
        assetId,
        { name: payload.name, description: payload.description, assetValue: payload.assetValue, status: payload.status },
        { walletAddress: address ?? undefined },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assets'] })
      setLifecycleNote('Asset metadata updated successfully')
      setTimeout(() => setLifecycleNote(null), 4000)
    },
  })

  const handleUpdateValuation = (asset: Asset) => {
    const nextValuationInput = window.prompt('New valuation (USD)', asset.assetValue.toString())
    if (!nextValuationInput) return
    const parsed = Number(nextValuationInput)
    if (Number.isNaN(parsed)) return
    updateAssetMutation.mutate({ assetId: asset.id, payload: { assetValue: parsed } })
  }

  const handleLifecycleAction = (asset: Asset, status: AssetStatus) => {
    updateAssetMutation.mutate({ assetId: asset.id, payload: { status } })
  }

  if (!isConnected) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <ShieldCheck className="h-10 w-10 text-black" />
        <div>
          <h1 className="text-3xl font-semibold">Connect your wallet</h1>
          <p className="text-gray-500">Access portfolio analytics, documents, and workflow updates once connected.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 bg-gray-50 px-4 py-10 md:px-8">
      <div className="rounded-3xl bg-gradient-to-r from-black to-gray-900 p-10 text-white shadow-xl">
        <p className="text-sm uppercase tracking-[0.3em] text-white/70">Owner dashboard</p>
        <h1 className="mt-3 text-4xl font-semibold">Monitor tokenized assets in real-time</h1>
        <p className="mt-4 text-lg text-white/80">
          Track valuation, fractional sales, blockchain transactions, and compliance artifacts from a single workspace.
        </p>
      </div>

      {lifecycleNote && (
        <div className="flex items-center gap-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <ShieldCheck className="h-4 w-4" />
          {lifecycleNote}
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          icon={<Coins className="h-6 w-6" />}
          label="Total tokenized valuation"
          value={`$${totalValuation.toLocaleString()}`}
          caption="Across all submitted assets"
        />
        <StatCard
          icon={<Signal className="h-6 w-6" />}
          label="Capital raised"
          value={`$${totalRaised.toLocaleString()}`}
          caption="From fractional sales"
        />
        <StatCard
          icon={<FileText className="h-6 w-6" />}
          label="Documents pinned to IPFS"
          value={documentsData?.documents?.length ?? 0}
          caption="With version history"
        />
      </div>

      <section className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold">Tokenized assets</h2>
            <p className="text-sm text-gray-500">Real-time lifecycle status, ownership distribution, and quick actions.</p>
          </div>
          <button
            type="button"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['assets'] })}
            className="inline-flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold"
          >
            <RefreshCcw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-gray-500">
                <th className="pb-3">Asset</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Available shares</th>
                <th className="pb-3">Valuation</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {assetsLoading && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-500">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin" />
                  </td>
                </tr>
              )}
              {ownerAssets.map((asset) => {
                const meta = statusCopy[asset.status]
                const sharePrice = Number(asset.assetValue ?? 0) / asset.totalShares || 0
                const soldShares = asset.totalShares - asset.availableShares
                const progress = Math.round((soldShares / asset.totalShares) * 100)
                return (
                  <tr key={asset.id} className="align-top">
                    <td className="py-4">
                      <p className="font-semibold text-gray-900">{asset.name}</p>
                      <p className="text-xs text-gray-500">Token ID {asset.tokenId ?? '—'}</p>
                    </td>
                    <td className="py-4">
                      <span className={cn('inline-flex rounded-full px-3 py-1 text-xs font-semibold', meta.color)}>
                        {meta.label}
                      </span>
                      <p className="text-xs text-gray-500">{meta.description}</p>
                    </td>
                    <td className="py-4">
                      <p className="font-semibold">{asset.availableShares} / {asset.totalShares}</p>
                      <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                        <div className="h-2 rounded-full bg-black" style={{ width: `${progress}%` }} />
                      </div>
                    </td>
                    <td className="py-4">
                      <p className="font-semibold">${Number(asset.assetValue ?? 0).toLocaleString()}</p>
                      <p className="text-xs text-gray-500">Share price ${sharePrice.toFixed(2)}</p>
                    </td>
                    <td className="py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateValuation(asset)}
                          className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold"
                        >
                          Update valuation
                        </button>
                        <button
                          type="button"
                          onClick={() => handleLifecycleAction(asset, asset.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE')}
                          className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold"
                        >
                          {asset.status === 'ACTIVE' ? 'Pause trading' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Document repository</h2>
              <p className="text-sm text-gray-500">Latest uploads and version history.</p>
            </div>
            <FileText className="h-5 w-5 text-gray-400" />
          </div>
          <ul className="mt-6 space-y-3">
            {(documentsData?.documents ?? []).map((doc) => (
              <li key={doc.id} className="flex items-center justify-between rounded-2xl border border-gray-100 px-4 py-3 text-sm">
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
                  View <ArrowUpRight className="h-3 w-3" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Blockchain transactions</h2>
              <p className="text-sm text-gray-500">Live monitoring with friendly status updates.</p>
            </div>
            <Coins className="h-5 w-5 text-gray-400" />
          </div>
          <ul className="mt-6 space-y-3">
            {ownerTransactions.map((tx) => (
              <li key={tx.id} className="rounded-2xl border border-gray-100 px-4 py-3 text-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{tx.type}</p>
                    <p className="text-xs text-gray-500">Hash {tx.txHash.slice(0, 10)}...</p>
                  </div>
                  <span
                    className={cn('rounded-full px-3 py-1 text-xs font-semibold', {
                      'bg-green-100 text-green-700': tx.status === 'CONFIRMED',
                      'bg-amber-100 text-amber-700': tx.status === 'PENDING',
                      'bg-red-100 text-red-700': tx.status === 'FAILED',
                    })}
                  >
                    {tx.status}
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  {tx.status === 'PENDING'
                    ? 'We are tracking confirmations on Base. Expect finality in ~2 blocks.'
                    : tx.status === 'CONFIRMED'
                      ? 'Transaction final on-chain. Metadata updated automatically.'
                      : 'Transaction failed. Please review gas settings and retry.'}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}

function StatCard({ icon, label, value, caption }: { icon: ReactNode; label: string; value: string | number; caption: string }) {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{label}</p>
          <p className="mt-2 text-2xl font-semibold text-gray-900">{value}</p>
        </div>
        <div className="rounded-full bg-black/5 p-3 text-black">{icon}</div>
      </div>
      <p className="mt-3 text-xs uppercase tracking-wide text-gray-400">{caption}</p>
    </div>
  )
}

