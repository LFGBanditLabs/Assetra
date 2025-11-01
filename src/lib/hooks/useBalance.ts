'use client'

import { useBalance as useWagmiBalance } from 'wagmi'
import { useAccount } from 'wagmi'

/**
 * Custom hook for fetching wallet balance
 */
export function useBalance() {
  const { address } = useAccount()
  const { data, isLoading, isError, refetch } = useWagmiBalance({
    address,
  })

  return {
    balance: data,
    isLoading,
    isError,
    refetch,
  }
}
