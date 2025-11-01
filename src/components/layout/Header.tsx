'use client'

import Link from 'next/link'
import { useAccount } from 'wagmi'
import { ConnectButton } from '@/components/wallet/ConnectButton'
import { WalletInfo } from '@/components/wallet/WalletInfo'
import { Coins } from 'lucide-react'

export function Header() {
  const { isConnected } = useAccount()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-black/10 bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <Coins className="h-6 w-6" />
          <span className="text-xl font-bold">Assetra</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/marketplace"
            className="text-sm font-medium transition-colors hover:text-black/60"
          >
            Marketplace
          </Link>
          <Link
            href="/tokenize"
            className="text-sm font-medium transition-colors hover:text-black/60"
          >
            Tokenize Asset
          </Link>
          <Link
            href="/dashboard"
            className="text-sm font-medium transition-colors hover:text-black/60"
          >
            Dashboard
          </Link>
          <Link
            href="/about"
            className="text-sm font-medium transition-colors hover:text-black/60"
          >
            About
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          {isConnected ? <WalletInfo /> : <ConnectButton />}
        </div>
      </div>
    </header>
  )
}
