import { NextRequest, NextResponse } from 'next/server';
import {
  createAssetMetadata,
  updateAssetMetadata,
  fetchMetadata,
} from '@/lib/services/ipfs/assetMetadata';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/utils/apiError';
import { logger } from '@/lib/utils/logger';
import { rateLimit } from '@/lib/middleware/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit({ windowMs: 60000, maxRequests: 10 })(req);
    if (rateLimitResult) return rateLimitResult;

    // Get user from request
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's wallet address
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { walletAddress: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const body = await req.json();
    const { assetData } = body;

    if (!assetData) {
      return NextResponse.json({ error: 'Asset data required' }, { status: 400 });
    }

    // Create and upload metadata
    const result = await createAssetMetadata(assetData, user.walletAddress);

    // Store metadata record
    await prisma.ipfsUpload.create({
      data: {
        ipfsHash: result.metadataHash,
        gatewayUrl: result.metadataUrl,
        fileSize: JSON.stringify(result.assetData).length,
        fileName: `${assetData.name}-metadata.json`,
        mimeType: 'application/json',
        category: 'METADATA',
        userId,
        metadata: result.assetData,
        pinStatus: 'PINNED',
      },
    });

    logger.info('Asset metadata created', {
      userId,
      metadataHash: result.metadataHash,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          metadataHash: result.metadataHash,
          metadataUrl: result.metadataUrl,
          assetData: result.assetData,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit({ windowMs: 60000, maxRequests: 10 })(req);
    if (rateLimitResult) return rateLimitResult;

    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { existingHash, updates } = body;

    if (!existingHash || !updates) {
      return NextResponse.json(
        { error: 'Existing hash and updates required' },
        { status: 400 }
      );
    }

    // Update metadata
    const result = await updateAssetMetadata(existingHash, updates);

    // Store new metadata record
    await prisma.ipfsUpload.create({
      data: {
        ipfsHash: result.metadataHash,
        gatewayUrl: result.metadataUrl,
        fileSize: JSON.stringify(result.assetData).length,
        fileName: `${updates.name || 'asset'}-metadata-updated.json`,
        mimeType: 'application/json',
        category: 'METADATA',
        userId,
        metadata: result.assetData,
        pinStatus: 'PINNED',
      },
    });

    logger.info('Asset metadata updated', {
      userId,
      oldHash: existingHash,
      newHash: result.metadataHash,
    });

    return NextResponse.json({
      success: true,
      data: {
        metadataHash: result.metadataHash,
        metadataUrl: result.metadataUrl,
        assetData: result.assetData,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const hash = searchParams.get('hash');

    if (!hash) {
      return NextResponse.json({ error: 'IPFS hash required' }, { status: 400 });
    }

    const metadata = await fetchMetadata(hash);

    return NextResponse.json({
      success: true,
      data: metadata,
    });
  } catch (error) {
    return handleApiError(error);
  }
}