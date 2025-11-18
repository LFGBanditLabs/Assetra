import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db/prisma'

/**
 * Utility helper to resolve the acting user from API request headers.
 * Supports either an explicit x-user-id header or wallet-based auto-provisioning.
 */
export async function resolveRequestUser(req: NextRequest) {
  const headerUserId = req.headers.get('x-user-id')

  if (headerUserId) {
    const user = await prisma.user.findUnique({
      where: { id: headerUserId },
    })

    if (user) {
      return user
    }
  }

  const walletAddress = req.headers.get('x-wallet-address')

  if (!walletAddress) {
    return null
  }

  const normalizedWallet = walletAddress.toLowerCase()

  const user = await prisma.user.upsert({
    where: { walletAddress: normalizedWallet },
    update: {},
    create: {
      walletAddress: normalizedWallet,
      email: req.headers.get('x-user-email') ?? undefined,
      transactionLimit: 0,
    },
  })

  return user
}

