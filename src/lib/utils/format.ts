/**
 * Format wallet address to short version
 * @param address - Full wallet address
 * @param chars - Number of characters to show on each side (default: 4)
 * @returns Shortened address (e.g., 0x1234...5678)
 */
export function formatAddress(address: string, chars = 4): string {
  if (!address) return ''
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`
}

/**
 * Format number with commas
 * @param value - Number to format
 * @returns Formatted number string
 */
export function formatNumber(value: number | string): string {
  const num = typeof value === 'string' ? parseFloat(value) : value
  return new Intl.NumberFormat('en-US').format(num)
}

/**
 * Format balance with token symbol
 * @param balance - Balance value
 * @param symbol - Token symbol (e.g., ETH, MATIC)
 * @param decimals - Number of decimal places (default: 4)
 * @returns Formatted balance string
 */
export function formatBalance(
  balance: number | string,
  symbol: string,
  decimals = 4
): string {
  const num = typeof balance === 'string' ? parseFloat(balance) : balance
  return `${num.toFixed(decimals)} ${symbol}`
}
