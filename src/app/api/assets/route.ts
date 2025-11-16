import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { createAssetSchema, assetQuerySchema } from '@/lib/validations/asset';
import { handleApiError } from '@/lib/utils/apiError';
import { logger } from '@/lib/utils/logger';
import { rateLimit } from '@/lib/middleware/rateLimit';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = assetQuerySchema.parse(Object.fromEntries(searchParams));

    const { page, limit, assetType, status, search } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (assetType) where.assetType = assetType;
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: {
            select: {
              id: true,
              walletAddress: true,
            },
          },
        },
      }),
      prisma.asset.count({ where }),
    ]);

    return NextResponse.json({
      assets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit({ windowMs: 60000, maxRequests: 10 })(req);
    if (rateLimitResult) return rateLimitResult;

    const body = await req.json();
    const data = createAssetSchema.parse(body);

    // Get user from request (would normally come from auth middleware)
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const asset = await prisma.asset.create({
      data: {
        ...data,
        tokenId: 0, // Will be set when minted on-chain
        contractAddress: '', // Will be set when deployed
        availableShares: data.totalShares,
        ownerId: userId,
      },
    });

    logger.info('Asset created', { assetId: asset.id, ownerId: userId });

    return NextResponse.json({ asset }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
