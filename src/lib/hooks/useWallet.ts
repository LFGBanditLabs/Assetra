'use client'

import { useAccount, useConnect, useDisconnect } from 'wagmi'

/**
 * Custom hook for wallet interactions
 */
export function useWallet() {
  const { address, isConnected, chain } = useAccount()
  const { connect, connectors } = useConnect()
  const { disconnect } = useDisconnect()

  return {
    address,
    isConnected,
    chain,
    connect,
    disconnect,
    connectors,
  }
}
