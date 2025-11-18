import { NextRequest, NextResponse } from 'next/server';
import { uploadBatch } from '@/lib/services/ipfs/pinata';
import { validateFiles, type FileCategory } from '@/lib/services/ipfs/validation';
import { prisma } from '@/lib/db/prisma';
import { handleApiError } from '@/lib/utils/apiError';
import { logger } from '@/lib/utils/logger';
import { rateLimit } from '@/lib/middleware/rateLimit';

const MAX_BATCH_SIZE = 10;
const MAX_TOTAL_SIZE = 100 * 1024 * 1024; // 100MB

export async function POST(req: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit({ windowMs: 60000, maxRequests: 5 })(req);
    if (rateLimitResult) return rateLimitResult;

    // Get user from request
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await req.formData();
    const files: Array<{ file: File; category: FileCategory }> = [];
    const assetId = formData.get('assetId') as string | null;

    // Extract files from form data
    let fileIndex = 0;
    while (formData.has(`file_${fileIndex}`)) {
      const file = formData.get(`file_${fileIndex}`) as File;
      const category =
        (formData.get(`category_${fileIndex}`) as FileCategory) || 'DOCUMENT';
      files.push({ file, category });
      fileIndex++;
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (files.length > MAX_BATCH_SIZE) {
      return NextResponse.json(
        { error: `Maximum ${MAX_BATCH_SIZE} files allowed per batch` },
        { status: 400 }
      );
    }

    // Validate all files
    const validation = validateFiles(files, MAX_TOTAL_SIZE);
    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Batch validation failed',
          details: validation.errors,
          fileResults: validation.results,
        },
        { status: 400 }
      );
    }

    logger.info('Starting batch upload', { userId, fileCount: files.length });

    // Upload files to IPFS
    const uploadData = files.map(({ file, category }) => ({
      file,
      filename: file.name,
      metadata: { category, userId },
    }));

    const batchResult = await uploadBatch(uploadData);

    // Store successful uploads in database
    const dbRecords = await Promise.all(
      batchResult.successful.map((result, index) =>
        prisma.ipfsUpload.create({
          data: {
            ipfsHash: result.ipfsHash,
            gatewayUrl: result.gatewayUrl,
            fileSize: result.size,
            fileName: files[index].file.name,
            mimeType: files[index].file.type,
            category: files[index].category,
            userId,
            assetId,
            pinStatus: 'PINNED',
          },
        })
      )
    );

    logger.info('Batch upload completed', {
      userId,
      successful: batchResult.successful.length,
      failed: batchResult.failed.length,
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          successful: dbRecords.map((record, index) => ({
            id: record.id,
            ipfsHash: record.ipfsHash,
            gatewayUrl: record.gatewayUrl,
            fileName: record.fileName,
          })),
          failed: batchResult.failed,
          summary: {
            total: files.length,
            successful: batchResult.successful.length,
            failed: batchResult.failed.length,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}