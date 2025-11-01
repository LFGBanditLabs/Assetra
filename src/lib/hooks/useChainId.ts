'use client'

import { useAccount, useSwitchChain } from 'wagmi'

/**
 * Custom hook for chain ID and switching
 */
export function useChainId() {
  const { chain } = useAccount()
  const { switchChain, chains } = useSwitchChain()

  return {
    chainId: chain?.id,
    chain,
    switchChain,
    availableChains: chains,
  }
}
