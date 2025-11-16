import { NextRequest, NextResponse } from 'next/server';
import { verifyMessage } from 'viem';
import { prisma } from '@/lib/db/prisma';
import { walletSignatureSchema } from '@/lib/validations/user';
import { handleApiError } from '@/lib/utils/apiError';
import { logger } from '@/lib/utils/logger';
import { rateLimit } from '@/lib/middleware/rateLimit';

export async function POST(req: NextRequest) {
  const startTime = Date.now();

  try {
    // Rate limiting
    const rateLimitResult = await rateLimit()(req);
    if (rateLimitResult) return rateLimitResult;

    const body = await req.json();
    const { walletAddress, signature, message } = walletSignatureSchema.parse(body);

    // Verify signature
    const isValid = await verifyMessage({
      address: walletAddress as `0x${string}`,
      message,
      signature: signature as `0x${string}`,
    });

    if (!isValid) {
      logger.warn('Invalid wallet signature', { walletAddress });
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { walletAddress },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          walletAddress,
        },
      });
      logger.info('New user created', { walletAddress });
    }

    logger.api('POST', '/api/auth/verify', 200, Date.now() - startTime);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        walletAddress: user.walletAddress,
        kycStatus: user.kycStatus,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
