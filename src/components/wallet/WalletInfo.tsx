'use client'

import { useAppKit } from '@reown/appkit/react'
import { useAccount, useDisconnect, useBalance } from 'wagmi'
import { formatAddress, formatBalance } from '@/lib/utils/format'
import { ChevronDown, Copy, LogOut, Wallet } from 'lucide-react'
import { useState } from 'react'

export function WalletInfo() {
  const { open } = useAppKit()
  const { address, chain } = useAccount()
  const { disconnect } = useDisconnect()
  const { data: balance } = useBalance({ address })
  const [showMenu, setShowMenu] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!address) {
    return null
  }

  const handleCopy = async () => {
    if (address) {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5"
      >
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4" />
          <span className="hidden sm:inline">
            {balance && formatBalance(
              parseFloat(balance.formatted),
              balance.symbol,
              3
            )}
          </span>
          <span className="font-mono">{formatAddress(address)}</span>
        </div>
        <ChevronDown className="h-4 w-4" />
      </button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 top-full z-20 mt-2 w-64 rounded-lg border border-black/10 bg-white p-2 shadow-lg">
            <div className="border-b border-black/10 pb-2 mb-2">
              <div className="px-3 py-2">
                <p className="text-xs text-black/60 mb-1">Connected to</p>
                <p className="font-medium">{chain?.name || 'Unknown Network'}</p>
              </div>
              <div className="px-3 py-2">
                <p className="text-xs text-black/60 mb-1">Balance</p>
                <p className="font-mono">
                  {balance ? formatBalance(
                    parseFloat(balance.formatted),
                    balance.symbol,
                    4
                  ) : '0.0000'}
                </p>
              </div>
            </div>

            <button
              onClick={handleCopy}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-black/5 transition-colors"
            >
              <Copy className="h-4 w-4" />
              <span>{copied ? 'Copied!' : 'Copy Address'}</span>
            </button>

            <button
              onClick={() => {
                open({ view: 'Networks' })
                setShowMenu(false)
              }}
              className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-black/5 transition-colors"
            >
              <Wallet className="h-4 w-4" />
              <span>Switch Network</span>
            </button>

            <div className="border-t border-black/10 mt-2 pt-2">
              <button
                onClick={() => {
                  disconnect()
                  setShowMenu(false)
                }}
                className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Disconnect</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
