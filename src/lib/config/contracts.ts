export const CONTRACTS = {
  ASSET_NFT: process.env.NEXT_PUBLIC_ASSET_NFT as `0x${string}` | undefined,
  BRIDGE_SOURCE: process.env.NEXT_PUBLIC_BRIDGE_SOURCE as `0x${string}` | undefined,
  BRIDGE_DESTINATION: process.env.NEXT_PUBLIC_BRIDGE_DESTINATION as `0x${string}` | undefined,
  WRAPPED_721: process.env.NEXT_PUBLIC_WRAPPED_721 as `0x${string}` | undefined,
}

export function assertContracts() {
  const missing = Object.entries(CONTRACTS)
    .filter(([, v]) => !v)
    .map(([k]) => k)
  if (missing.length) {
    throw new Error(`Missing contract addresses in env: ${missing.join(', ')}`)
  }
}
