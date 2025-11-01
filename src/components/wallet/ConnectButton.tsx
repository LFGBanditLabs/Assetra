'use client'

import { useAppKit } from '@reown/appkit/react'

export function ConnectButton() {
  const { open } = useAppKit()

  return (
    <button
      onClick={() => open()}
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-black text-white hover:bg-black/90 h-10 px-6"
    >
      Connect Wallet
    </button>
  )
}
