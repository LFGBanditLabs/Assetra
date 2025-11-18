import { ApiError } from '@/lib/utils/apiError';
import { logger } from '@/lib/utils/logger';

// Maximum file sizes (in bytes)
export const MAX_FILE_SIZES = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  VIDEO: 100 * 1024 * 1024, // 100MB
  DOCUMENT: 20 * 1024 * 1024, // 20MB
  METADATA: 1 * 1024 * 1024, // 1MB
};

// Allowed MIME types
export const ALLOWED_MIME_TYPES = {
  IMAGE: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
  ],
  VIDEO: ['video/mp4', 'video/webm', 'video/quicktime'],
  DOCUMENT: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
  ],
  METADATA: ['application/json'],
};

export type FileCategory = 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'METADATA';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  fileInfo?: {
    size: number;
    type: string;
    category: FileCategory;
  };
}

/**
 * Validate file before upload
 */
export function validateFile(
  file: File | Buffer,
  category: FileCategory,
  customMaxSize?: number
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Get file info
  const size = file instanceof File ? file.size : file.length;
  const type = file instanceof File ? file.type : 'application/octet-stream';

  // Check file size
  const maxSize = customMaxSize || MAX_FILE_SIZES[category];
  if (size > maxSize) {
    errors.push(
      `File size (${formatBytes(size)}) exceeds maximum allowed size (${formatBytes(maxSize)})`
    );
  }

  // Check MIME type for File objects
  if (file instanceof File) {
    const allowedTypes = ALLOWED_MIME_TYPES[category];
    if (!allowedTypes.includes(type)) {
      errors.push(
        `File type "${type}" is not allowed for ${category}. Allowed types: ${allowedTypes.join(', ')}`
      );
    }
  }

  // Warn if file is very large
  if (size > maxSize * 0.8) {
    warnings.push(`File size is close to the maximum limit`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
    fileInfo: {
      size,
      type,
      category,
    },
  };
}

/**
 * Validate multiple files
 */
export function validateFiles(
  files: Array<{ file: File | Buffer; category: FileCategory }>,
  maxTotalSize?: number
): {
  valid: boolean;
  results: Array<{ index: number; result: ValidationResult }>;
  totalSize: number;
  errors: string[];
} {
  const results: Array<{ index: number; result: ValidationResult }> = [];
  const errors: string[] = [];
  let totalSize = 0;

  files.forEach((item, index) => {
    const result = validateFile(item.file, item.category);
    results.push({ index, result });

    if (result.fileInfo) {
      totalSize += result.fileInfo.size;
    }
  });

  // Check total size if specified
  if (maxTotalSize && totalSize > maxTotalSize) {
    errors.push(
      `Total size (${formatBytes(totalSize)}) exceeds maximum allowed (${formatBytes(maxTotalSize)})`
    );
  }

  const allValid = results.every((r) => r.result.valid) && errors.length === 0;

  return {
    valid: allValid,
    results,
    totalSize,
    errors,
  };
}

/**
 * Validate asset metadata structure
 */
export function validateAssetMetadata(metadata: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  const requiredFields = ['name', 'description', 'assetType', 'assetValue'];
  for (const field of requiredFields) {
    if (!metadata[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  // Validate asset value
  if (metadata.assetValue !== undefined) {
    const value = Number(metadata.assetValue);
    if (isNaN(value) || value <= 0) {
      errors.push('Asset value must be a positive number');
    }
  }

  // Validate total shares
  if (metadata.totalShares !== undefined) {
    const shares = Number(metadata.totalShares);
    if (!Number.isInteger(shares) || shares <= 0) {
      errors.push('Total shares must be a positive integer');
    }
  }

  // Warn about optional fields
  const optionalFields = ['location', 'images', 'documents', 'verificationCertificates'];
  const missingOptional = optionalFields.filter((field) => !metadata[field]);
  if (missingOptional.length > 0) {
    warnings.push(`Optional fields not provided: ${missingOptional.join(', ')}`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Sanitize filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}

/**
 * Format bytes to human-readable string
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Detect file category from MIME type
 */
export function detectFileCategory(mimeType: string): FileCategory | null {
  for (const [category, types] of Object.entries(ALLOWED_MIME_TYPES)) {
    if (types.includes(mimeType)) {
      return category as FileCategory;
    }
  }
  return null;
}

/**
 * Basic virus scan simulation (placeholder for actual implementation)
 * In production, integrate with services like ClamAV or VirusTotal
 */
export async function scanForVirus(file: File | Buffer): Promise<{
  clean: boolean;
  threats: string[];
}> {
  // Placeholder implementation
  // In production, integrate with actual virus scanning service
  logger.info('Performing virus scan', {
    size: file instanceof File ? file.size : file.length,
  });

  // Simulate scan delay
  await new Promise((resolve) => setTimeout(resolve, 100));

  // For now, always return clean
  // TODO: Integrate with actual virus scanning service
  return {
    clean: true,
    threats: [],
  };
}

/**
 * Validate and sanitize metadata for IPFS storage
 */
export function sanitizeMetadata(metadata: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};

  for (const [key, value] of Object.entries(metadata)) {
    // Remove null and undefined values
    if (value === null || value === undefined) continue;

    // Sanitize string values
    if (typeof value === 'string') {
      sanitized[key] = value.trim();
    }
    // Keep numbers, booleans, and objects as-is
    else if (
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'object'
    ) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}