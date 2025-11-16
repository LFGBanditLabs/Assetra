import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { updateUserSchema } from '@/lib/validations/user';
import { handleApiError } from '@/lib/utils/apiError';
import { logger } from '@/lib/utils/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        ownedAssets: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        shares: {
          take: 10,
          include: { asset: true },
        },
        transactions: {
          take: 10,
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const data = updateUserSchema.parse(body);

    const user = await prisma.user.update({
      where: { id: params.id },
      data,
    });

    logger.info('User updated', { userId: user.id });

    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
