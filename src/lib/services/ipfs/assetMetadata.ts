import { uploadJSON, uploadFile, type UploadResult } from './pinata';
import { validateAssetMetadata, sanitizeMetadata } from './validation';
import { ApiError } from '@/lib/utils/apiError';
import { logger } from '@/lib/utils/logger';
import type { AssetType } from '@prisma/client';

export interface AssetMetadata {
  // Core asset information
  name: string;
  description: string;
  assetType: AssetType;
  assetValue: number;
  totalShares: number;
  location?: string;

  // Ownership and compliance
  ownerAddress: string;
  ownershipProof?: string;
  complianceDocuments?: string[];

  // Asset details
  images?: string[]; // IPFS hashes
  videos?: string[]; // IPFS hashes
  documents?: string[]; // IPFS hashes
  verificationCertificates?: string[]; // IPFS hashes

  // Additional metadata
  attributes?: Record<string, any>;
  externalUrl?: string;

  // Timestamps
  createdAt: string;
  updatedAt?: string;
}

export interface AssetMetadataUploadResult {
  metadataHash: string;
  metadataUrl: string;
  assetData: AssetMetadata;
}

/**
 * Create and upload complete asset metadata to IPFS
 */
export async function createAssetMetadata(
  assetData: Partial<AssetMetadata>,
  ownerAddress: string
): Promise<AssetMetadataUploadResult> {
  try {
    // Validate metadata structure
    const validation = validateAssetMetadata(assetData);
    if (!validation.valid) {
      throw new ApiError(400, `Invalid metadata: ${validation.errors.join(', ')}`);
    }

    // Create complete metadata object
    const metadata: AssetMetadata = {
      name: assetData.name!,
      description: assetData.description!,
      assetType: assetData.assetType!,
      assetValue: assetData.assetValue!,
      totalShares: assetData.totalShares!,
      location: assetData.location,
      ownerAddress,
      ownershipProof: assetData.ownershipProof,
      complianceDocuments: assetData.complianceDocuments || [],
      images: assetData.images || [],
      videos: assetData.videos || [],
      documents: assetData.documents || [],
      verificationCertificates: assetData.verificationCertificates || [],
      attributes: sanitizeMetadata(assetData.attributes || {}),
      externalUrl: assetData.externalUrl,
      createdAt: new Date().toISOString(),
    };

    logger.info('Creating asset metadata', { name: metadata.name });

    // Upload metadata to IPFS
    const result = await uploadJSON(metadata, {
      name: `${metadata.name}-metadata`,
      metadata: {
        assetType: metadata.assetType,
        ownerAddress,
      },
    });

    return {
      metadataHash: result.ipfsHash,
      metadataUrl: result.gatewayUrl,
      assetData: metadata,
    };
  } catch (error) {
    logger.error('Failed to create asset metadata', error);
    throw error instanceof ApiError
      ? error
      : new ApiError(500, 'Failed to create asset metadata');
  }
}

/**
 * Update existing asset metadata
 */
export async function updateAssetMetadata(
  existingMetadataHash: string,
  updates: Partial<AssetMetadata>
): Promise<AssetMetadataUploadResult> {
  try {
    // Fetch existing metadata
    const existingMetadata = await fetchMetadata(existingMetadataHash);

    // Merge updates
    const updatedMetadata: AssetMetadata = {
      ...existingMetadata,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Validate updated metadata
    const validation = validateAssetMetadata(updatedMetadata);
    if (!validation.valid) {
      throw new ApiError(400, `Invalid metadata: ${validation.errors.join(', ')}`);
    }

    logger.info('Updating asset metadata', { hash: existingMetadataHash });

    // Upload new version to IPFS
    const result = await uploadJSON(updatedMetadata, {
      name: `${updatedMetadata.name}-metadata-updated`,
      metadata: {
        assetType: updatedMetadata.assetType,
        previousHash: existingMetadataHash,
      },
    });

    return {
      metadataHash: result.ipfsHash,
      metadataUrl: result.gatewayUrl,
      assetData: updatedMetadata,
    };
  } catch (error) {
    logger.error('Failed to update asset metadata', error);
    throw error instanceof ApiError
      ? error
      : new ApiError(500, 'Failed to update asset metadata');
  }
}

/**
 * Fetch metadata from IPFS
 */
export async function fetchMetadata(ipfsHash: string): Promise<AssetMetadata> {
  try {
    const gateway = process.env.PINATA_GATEWAY || 'gateway.pinata.cloud';
    const url = `https://${gateway}/ipfs/${ipfsHash}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.statusText}`);
    }

    const metadata = await response.json();
    return metadata as AssetMetadata;
  } catch (error) {
    logger.error('Failed to fetch metadata from IPFS', error);
    throw new ApiError(500, 'Failed to fetch metadata from IPFS');
  }
}

/**
 * Upload asset images and return IPFS hashes
 */
export async function uploadAssetImages(
  images: File[]
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (const image of images) {
    try {
      const result = await uploadFile(image, {
        filename: image.name,
        metadata: {
          type: 'asset-image',
          mimeType: image.type,
        },
      });
      results.push(result);
    } catch (error) {
      logger.error('Failed to upload image', { filename: image.name, error });
      throw new ApiError(500, `Failed to upload image: ${image.name}`);
    }
  }

  return results;
}

/**
 * Upload legal documents and return IPFS hashes
 */
export async function uploadLegalDocuments(
  documents: File[]
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (const doc of documents) {
    try {
      const result = await uploadFile(doc, {
        filename: doc.name,
        metadata: {
          type: 'legal-document',
          mimeType: doc.type,
        },
      });
      results.push(result);
    } catch (error) {
      logger.error('Failed to upload document', { filename: doc.name, error });
      throw new ApiError(500, `Failed to upload document: ${doc.name}`);
    }
  }

  return results;
}

/**
 * Upload verification certificates
 */
export async function uploadVerificationCertificates(
  certificates: File[]
): Promise<UploadResult[]> {
  const results: UploadResult[] = [];

  for (const cert of certificates) {
    try {
      const result = await uploadFile(cert, {
        filename: cert.name,
        metadata: {
          type: 'verification-certificate',
          mimeType: cert.type,
        },
      });
      results.push(result);
    } catch (error) {
      logger.error('Failed to upload certificate', { filename: cert.name, error });
      throw new ApiError(500, `Failed to upload certificate: ${cert.name}`);
    }
  }

  return results;
}

/**
 * Generate content hash for verification
 */
export async function generateContentHash(content: string | Buffer): Promise<string> {
  const encoder = new TextEncoder();
  const data = typeof content === 'string' ? encoder.encode(content) : content;

  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return hashHex;
}