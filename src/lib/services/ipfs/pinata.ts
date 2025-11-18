import { PinataSDK } from 'pinata';
import type { File as NodeFile } from 'buffer';
import { logger } from '@/lib/utils/logger';
import { ApiError } from '@/lib/utils/apiError';

// Initialize Pinata client
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT!,
  pinataGateway: process.env.PINATA_GATEWAY,
});

export interface UploadResult {
  ipfsHash: string;
  size: number;
  timestamp: string;
  gatewayUrl: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface BatchUploadResult {
  successful: UploadResult[];
  failed: Array<{ filename: string; error: string }>;
}

/**
 * Upload a file to IPFS via Pinata
 */
export async function uploadFile(
  file: File | NodeFile | Buffer,
  options?: {
    filename?: string;
    metadata?: Record<string, any>;
    onProgress?: (progress: UploadProgress) => void;
  }
): Promise<UploadResult> {
  try {
    logger.info('Uploading file to IPFS', { filename: options?.filename });

    const upload = await pinata.upload.file(file as File, {
      metadata: {
        name: options?.filename || 'unnamed',
        keyvalues: options?.metadata || {},
      },
    });

    const result: UploadResult = {
      ipfsHash: upload.IpfsHash,
      size: upload.PinSize,
      timestamp: upload.Timestamp,
      gatewayUrl: convertToGatewayUrl(upload.IpfsHash),
    };

    logger.info('File uploaded successfully', { ipfsHash: result.ipfsHash });
    return result;
  } catch (error) {
    logger.error('Failed to upload file to IPFS', error);
    throw new ApiError(500, 'Failed to upload file to IPFS');
  }
}

/**
 * Upload JSON metadata to IPFS
 */
export async function uploadJSON(
  data: Record<string, any>,
  options?: {
    name?: string;
    metadata?: Record<string, any>;
  }
): Promise<UploadResult> {
  try {
    logger.info('Uploading JSON to IPFS', { name: options?.name });

    const upload = await pinata.upload.json(data, {
      metadata: {
        name: options?.name || 'metadata',
        keyvalues: options?.metadata || {},
      },
    });

    const result: UploadResult = {
      ipfsHash: upload.IpfsHash,
      size: upload.PinSize,
      timestamp: upload.Timestamp,
      gatewayUrl: convertToGatewayUrl(upload.IpfsHash),
    };

    logger.info('JSON uploaded successfully', { ipfsHash: result.ipfsHash });
    return result;
  } catch (error) {
    logger.error('Failed to upload JSON to IPFS', error);
    throw new ApiError(500, 'Failed to upload JSON to IPFS');
  }
}

/**
 * Upload multiple files in batch
 */
export async function uploadBatch(
  files: Array<{ file: File | Buffer; filename: string; metadata?: Record<string, any> }>
): Promise<BatchUploadResult> {
  const successful: UploadResult[] = [];
  const failed: Array<{ filename: string; error: string }> = [];

  logger.info('Starting batch upload', { count: files.length });

  for (const { file, filename, metadata } of files) {
    try {
      const result = await uploadFile(file, { filename, metadata });
      successful.push(result);
    } catch (error) {
      failed.push({
        filename,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  logger.info('Batch upload completed', {
    successful: successful.length,
    failed: failed.length,
  });

  return { successful, failed };
}

/**
 * Pin an existing IPFS hash
 */
export async function pinByHash(
  ipfsHash: string,
  options?: {
    name?: string;
    metadata?: Record<string, any>;
  }
): Promise<void> {
  try {
    logger.info('Pinning IPFS hash', { ipfsHash });

    await pinata.pin.cid(ipfsHash, {
      metadata: {
        name: options?.name || ipfsHash,
        keyvalues: options?.metadata || {},
      },
    });

    logger.info('Hash pinned successfully', { ipfsHash });
  } catch (error) {
    logger.error('Failed to pin IPFS hash', error);
    throw new ApiError(500, 'Failed to pin IPFS hash');
  }
}

/**
 * Unpin a file from IPFS
 */
export async function unpinFile(ipfsHash: string): Promise<void> {
  try {
    logger.info('Unpinning file', { ipfsHash });
    await pinata.unpin([ipfsHash]);
    logger.info('File unpinned successfully', { ipfsHash });
  } catch (error) {
    logger.error('Failed to unpin file', error);
    throw new ApiError(500, 'Failed to unpin file');
  }
}

/**
 * Get pin status for a hash
 */
export async function getPinStatus(ipfsHash: string): Promise<{
  isPinned: boolean;
  pinDate?: string;
  size?: number;
}> {
  try {
    const pins = await pinata.pins.list({
      cid: ipfsHash,
      pageLimit: 1,
    });

    if (pins.rows && pins.rows.length > 0) {
      const pin = pins.rows[0];
      return {
        isPinned: true,
        pinDate: pin.date_pinned,
        size: pin.size,
      };
    }

    return { isPinned: false };
  } catch (error) {
    logger.error('Failed to get pin status', error);
    throw new ApiError(500, 'Failed to get pin status');
  }
}

/**
 * List all pinned files with optional filters
 */
export async function listPinnedFiles(options?: {
  metadata?: Record<string, string>;
  pageLimit?: number;
  pageOffset?: number;
}): Promise<{
  rows: Array<{
    ipfsHash: string;
    size: number;
    timestamp: string;
    metadata?: any;
  }>;
  count: number;
}> {
  try {
    const result = await pinata.pins.list({
      metadata: options?.metadata,
      pageLimit: options?.pageLimit || 10,
      pageOffset: options?.pageOffset || 0,
    });

    return {
      rows: result.rows.map((pin: any) => ({
        ipfsHash: pin.ipfs_pin_hash,
        size: pin.size,
        timestamp: pin.date_pinned,
        metadata: pin.metadata,
      })),
      count: result.count,
    };
  } catch (error) {
    logger.error('Failed to list pinned files', error);
    throw new ApiError(500, 'Failed to list pinned files');
  }
}

/**
 * Convert IPFS hash to gateway URL
 */
export function convertToGatewayUrl(ipfsHash: string): string {
  const gateway = process.env.PINATA_GATEWAY || 'gateway.pinata.cloud';
  return `https://${gateway}/ipfs/${ipfsHash}`;
}

/**
 * Extract IPFS hash from gateway URL
 */
export function extractHashFromUrl(url: string): string | null {
  const match = url.match(/\/ipfs\/([a-zA-Z0-9]+)/);
  return match ? match[1] : null;
}

/**
 * Retry logic wrapper for upload operations
 */
export async function uploadWithRetry<T>(
  uploadFn: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadFn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      logger.warn(`Upload attempt ${attempt} failed`, { error: lastError.message });

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  throw new ApiError(500, `Upload failed after ${maxRetries} attempts: ${lastError?.message}`);
}