import { cookieStorage, createStorage } from 'wagmi'
import { mainnet, base, baseSepolia, sepolia } from 'wagmi/chains'

// Get project ID from environment
export const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID

if (!projectId) {
  throw new Error('NEXT_PUBLIC_REOWN_PROJECT_ID is not set')
}

// App metadata
export const metadata = {
  name: 'Assetra',
  description: 'Real World Asset Tokenization Platform - Bridging tangible assets to blockchain',
  url: 'https://assetra.io', // Update with your actual domain
  icons: ['https://assetra.io/icon.png'] // Update with your actual icon
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
