"use client"

import { useState } from "react"
import { useAccount } from "wagmi"
import Link from "next/link"

export default function BridgePage() {
  const { isConnected } = useAccount()
  const [tokenIds, setTokenIds] = useState("")
  const [destChainId, setDestChainId] = useState("")
  const [recipient, setRecipient] = useState("")
  const [status, setStatus] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("Submitting bridge request (MVP placeholder)...")
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Bridge Assets</h1>
      {!isConnected ? (
        <div className="text-gray-600">Connect your wallet to initiate a bridge transfer.</div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Token IDs (comma-separated)</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={tokenIds}
              onChange={(e) => setTokenIds(e.target.value)}
              placeholder="e.g. 1,2,3"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Destination Chain ID</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={destChainId}
              onChange={(e) => setDestChainId(e.target.value)}
              placeholder="e.g. 84532 (Base Sepolia)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Recipient</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="0x..."
            />
          </div>
          <button type="submit" className="px-4 py-2 rounded bg-black text-white">Bridge (MVP)</button>
          {status && <div className="text-sm text-gray-600 mt-2">{status}</div>}
        </form>
      )}

      <div className="mt-8 text-sm text-gray-600">
        <p>Track transfers and history will be available here in future iterations.</p>
        <p className="mt-2">See <Link className="underline" href="/">home</Link>.</p>
      </div>
    </div>
  )
}
