import { NextRequest, NextResponse } from 'next/server';
import { uploadFile, uploadWithRetry } from '@/lib/services/ipfs/pinata';
import { validateFile, scanForVirus, type FileCategory } from '@/lib/services/ipfs/validation';
import { prisma } from '@/lib/db/prisma';
import { handleApiError, ApiError } from '@/lib/utils/apiError';
import { logger } from '@/lib/utils/logger';
import { rateLimit } from '@/lib/middleware/rateLimit';

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit({ windowMs: 60000, maxRequests: 20 })(req);
    if (rateLimitResult) return rateLimitResult;

    // Get user from request
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const category = (formData.get('category') as FileCategory) || 'DOCUMENT';
    const assetId = formData.get('assetId') as string | null;
    const metadata = formData.get('metadata') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file
    const validation = validateFile(file, category);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'File validation failed',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // Virus scan
    const scanResult = await scanForVirus(file);
    if (!scanResult.clean) {
      logger.warn('Virus detected in upload', { userId, threats: scanResult.threats });
      return NextResponse.json(
        {
          error: 'File failed security scan',
          details: scanResult.threats,
        },
        { status: 400 }
      );
    }

    // Upload to IPFS with retry logic
    const uploadResult = await uploadWithRetry(
      () =>
        uploadFile(file, {
          filename: file.name,
          metadata: metadata ? JSON.parse(metadata) : { category, userId },
        }),
      3,
      1000
    );

    // Store upload record in database
    const ipfsUpload = await prisma.ipfsUpload.create({
      data: {
        ipfsHash: uploadResult.ipfsHash,
        gatewayUrl: uploadResult.gatewayUrl,
        fileSize: uploadResult.size,
        fileName: file.name,
        mimeType: file.type,
        category,
        userId,
        assetId,
        metadata: metadata ? JSON.parse(metadata) : null,
        pinStatus: 'PINNED',
      },
    });

    logger.info('File uploaded to IPFS', {
      userId,
      ipfsHash: uploadResult.ipfsHash,
      category,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          id: ipfsUpload.id,
          ipfsHash: uploadResult.ipfsHash,
          gatewayUrl: uploadResult.gatewayUrl,
          size: uploadResult.size,
          timestamp: uploadResult.timestamp,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const assetId = searchParams.get('assetId');
    const category = searchParams.get('category') as FileCategory | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const where: any = { userId };
    if (assetId) where.assetId = assetId;
    if (category) where.category = category;

    const [uploads, total] = await Promise.all([
      prisma.ipfsUpload.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { uploadedAt: 'desc' },
      }),
      prisma.ipfsUpload.count({ where }),
    ]);

    return NextResponse.json({
      uploads,
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
