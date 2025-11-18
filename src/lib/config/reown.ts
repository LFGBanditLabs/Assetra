import { cookieStorage, createStorage } from 'wagmi'
import { mainnet, base, baseSepolia, sepolia } from 'wagmi/chains'

// Get project ID from environment
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID

if (!projectId) {
  throw new Error('NEXT_PUBLIC_REOWN_PROJECT_ID is not set')
}

// App metadata - URL must match actual domain for Verify API
export const metadata = {
  name: 'Assetra',
  description: 'Real World Asset Tokenization Platform - Bridging tangible assets to blockchain',
  url: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
  icons: ['https://avatars.githubusercontent.com/u/179229932'] // Default icon
}

// Supported chains - Base as primary chain
export const chains = [
  base,           // Base Mainnet (Primary)
  baseSepolia,    // Base Sepolia Testnet
  mainnet,        // Ethereum Mainnet
  sepolia,        // Ethereum Sepolia Testnet
]

// Wagmi config
export const wagmiConfig = {
  chains,
  projectId,
  metadata,
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
}
