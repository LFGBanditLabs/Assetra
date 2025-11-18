"use client"

import { useMemo, useState } from "react"
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi"
import Link from "next/link"

const ASSET_NFT = process.env.NEXT_PUBLIC_ASSET_NFT as `0x${string}` | undefined
const BRIDGE_SOURCE = process.env.NEXT_PUBLIC_BRIDGE_SOURCE as `0x${string}` | undefined

const ERC721_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "operator", "type": "address" },
      { "internalType": "bool", "name": "approved", "type": "bool" }
    ],
    "name": "setApprovalForAll",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

const BRIDGE_SOURCE_ABI = [
  {
    "inputs": [
      { "internalType": "address", "name": "token", "type": "address" },
      { "internalType": "uint256[]", "name": "tokenIds", "type": "uint256[]" },
      { "internalType": "address", "name": "to", "type": "address" },
      { "internalType": "uint256", "name": "destinationChainId", "type": "uint256" }
    ],
    "name": "lockERC721Batch",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
] as const

export default function BridgePage() {
  const { isConnected } = useAccount()
  const [tokenIds, setTokenIds] = useState("")
  const [destChainId, setDestChainId] = useState("")
  const [recipient, setRecipient] = useState("")
  const [status, setStatus] = useState<string | null>(null)

  const tokenIdArray = useMemo(() => tokenIds.split(",").map(s => s.trim()).filter(Boolean).map(s => BigInt(s)), [tokenIds])
  const destChain = useMemo(() => destChainId ? BigInt(destChainId) : undefined, [destChainId])

  const { data: approveHash, writeContract: writeApprove, isPending: approving } = useWriteContract()
  const { data: lockHash, writeContract: writeLock, isPending: locking } = useWriteContract()

  const { isLoading: waitingApprove, isSuccess: approved } = useWaitForTransactionReceipt({ hash: approveHash })
  const { isLoading: waitingLock, isSuccess: locked } = useWaitForTransactionReceipt({ hash: lockHash })

  const onApprove = async () => {
    if (!ASSET_NFT || !BRIDGE_SOURCE) {
      setStatus("Missing contract addresses. Set NEXT_PUBLIC_ASSET_NFT and NEXT_PUBLIC_BRIDGE_SOURCE.")
      return
    }
    setStatus("Submitting approval...")
    writeApprove({
      abi: ERC721_ABI,
      address: ASSET_NFT,
      functionName: "setApprovalForAll",
      args: [BRIDGE_SOURCE, true],
    })
  }

  const onLock = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!ASSET_NFT || !BRIDGE_SOURCE) {
      setStatus("Missing contract addresses. Set NEXT_PUBLIC_ASSET_NFT and NEXT_PUBLIC_BRIDGE_SOURCE.")
      return
    }
    if (!recipient || !destChain || tokenIdArray.length === 0) {
      setStatus("Fill recipient, destination chain id, and token IDs.")
      return
    }
    setStatus("Locking tokens...")
    writeLock({
      abi: BRIDGE_SOURCE_ABI,
      address: BRIDGE_SOURCE,
      functionName: "lockERC721Batch",
      args: [ASSET_NFT, tokenIdArray, recipient as `0x${string}`, destChain],
    })
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-6">Bridge Assets</h1>
      {!isConnected ? (
        <div className="text-gray-600">Connect your wallet to initiate a bridge transfer.</div>
      ) : (
        <form onSubmit={onLock} className="space-y-4">
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
          <div className="flex gap-3">
            <button type="button" onClick={onApprove} className="px-4 py-2 rounded bg-gray-800 text-white" disabled={approving || waitingApprove}>
              {approving || waitingApprove ? "Approving..." : "Approve Bridge"}
            </button>
            <button type="submit" className="px-4 py-2 rounded bg-black text-white" disabled={locking || waitingLock}>
              {locking || waitingLock ? "Locking..." : "Bridge"}
            </button>
          </div>
          {status && <div className="text-sm text-gray-600 mt-2">{status}</div>}
          {approved && <div className="text-sm text-green-600">Approval confirmed.</div>}
          {locked && <div className="text-sm text-green-600">Lock transaction confirmed.</div>}
        </form>
      )}

      <div className="mt-8 text-sm text-gray-600">
        <p>Track transfers and history will be available here in future iterations.</p>
        <p className="mt-2">See <Link className="underline" href="/">home</Link>.</p>
      </div>
    </div>
  )
}
