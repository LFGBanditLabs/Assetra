import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { updateAssetSchema } from '@/lib/validations/asset';
import { handleApiError } from '@/lib/utils/apiError';
import { logger } from '@/lib/utils/logger';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const asset = await prisma.asset.findUnique({
      where: { id: params.id },
      include: {
        owner: {
          select: {
            id: true,
            walletAddress: true,
            kycStatus: true,
          },
        },
        shares: {
          include: {
            user: {
              select: {
                id: true,
                walletAddress: true,
              },
            },
          },
        },
        transactions: {
          orderBy: { timestamp: 'desc' },
          take: 20,
        },
        documents: true,
      },
    });

    if (!asset) {
      return NextResponse.json(
        { error: 'Asset not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ asset });
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
    const data = updateAssetSchema.parse(body);

    const asset = await prisma.asset.update({
      where: { id: params.id },
      data,
    });

    logger.info('Asset updated', { assetId: asset.id });

    return NextResponse.json({ asset });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.asset.delete({
      where: { id: params.id },
    });

    logger.info('Asset deleted', { assetId: params.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    return handleApiError(error);
  }
}
