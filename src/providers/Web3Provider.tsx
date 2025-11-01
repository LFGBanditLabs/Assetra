'use client'

import { ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createAppKit } from '@reown/appkit/react'
import { WagmiProvider } from 'wagmi'
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi'
import { projectId, metadata, chains } from '@/lib/config/reown'

// Ensure projectId exists
if (!projectId) {
  throw new Error('NEXT_PUBLIC_REOWN_PROJECT_ID is not set')
}

// Set up QueryClient
const queryClient = new QueryClient()

// Set up Wagmi Adapter
const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks: chains,
  ssr: true,
})

// Create AppKit modal
createAppKit({
  adapters: [wagmiAdapter],
  projectId,
  networks: chains as any,
  metadata,
  features: {
    analytics: true,
    email: true,
    socials: ['google', 'github', 'apple'],
    emailShowWallets: true,
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-font-family': 'var(--font-geist-sans)',
    '--w3m-accent': '#000000',
    '--w3m-border-radius-master': '2px',
  },
})

export function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  )
}
