# IPFS Storage Integration Documentation

## Overview

This document describes the IPFS storage integration using Pinata for the Assetra RWA platform. The integration provides decentralized storage for asset metadata, legal documents, images, and verification certificates.

## Features

### Core Capabilities

1. **File Upload**
   - Single file upload with validation
   - Batch upload for multiple files
   - Progress tracking support
   - Automatic retry logic for failed uploads

2. **Asset Metadata Management**
   - Create comprehensive asset metadata
   - Update existing metadata (creates new version)
   - Fetch metadata from IPFS
   - Validate metadata structure

3. **File Validation**
   - File size limits per category
   - MIME type validation
   - Virus scanning (placeholder for integration)
   - Content hash generation

4. **Pin Management**
   - Automatic pinning on upload
   - Pin status tracking
   - Unpin capability
   - Multi-node redundancy

## Architecture

### Service Layer

```
src/lib/services/ipfs/
├── pinata.ts           # Core Pinata SDK integration
├── validation.ts       # File validation and security
├── assetMetadata.ts    # Asset metadata management
└── index.ts            # Public API exports
```

### API Routes

```
src/app/api/ipfs/
├── upload/route.ts         # Single file upload
├── batch-upload/route.ts   # Batch file upload
└── metadata/route.ts       # Asset metadata operations
```

### Database Models

- **IpfsUpload**: Tracks all IPFS uploads with metadata
- **Document**: Enhanced with IPFS-specific fields

## Usage Examples

### 1. Upload a Single File

```typescript
// Client-side
const formData = new FormData();
formData.append('file', file);
formData.append('category', 'IMAGE');
formData.append('assetId', assetId);

const response = await fetch('/api/ipfs/upload', {
  method: 'POST',
  headers: {
    'x-user-id': userId,
  },
  body: formData,
});

const { data } = await response.json();
console.log('IPFS Hash:', data.ipfsHash);
console.log('Gateway URL:', data.gatewayUrl);
```

### 2. Batch Upload Files

```typescript
const formData = new FormData();
files.forEach((file, index) => {
  formData.append(`file_${index}`, file);
  formData.append(`category_${index}`, 'DOCUMENT');
});
formData.append('assetId', assetId);

const response = await fetch('/api/ipfs/batch-upload', {
  method: 'POST',
  headers: {
    'x-user-id': userId,
  },
  body: formData,
});

const { data } = await response.json();
console.log('Successful uploads:', data.successful.length);
console.log('Failed uploads:', data.failed.length);
```

### 3. Create Asset Metadata

```typescript
const assetData = {
  name: 'Luxury Apartment NYC',
  description: 'Premium real estate in Manhattan',
  assetType: 'REAL_ESTATE',
  assetValue: 1000000,
  totalShares: 1000,
  location: 'New York, NY',
  images: ['QmHash1', 'QmHash2'],
  documents: ['QmHash3'],
};

const response = await fetch('/api/ipfs/metadata', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-user-id': userId,
  },
  body: JSON.stringify({ assetData }),
});

const { data } = await response.json();
console.log('Metadata Hash:', data.metadataHash);
```

### 4. Server-side Upload

```typescript
import { uploadFile, uploadJSON } from '@/lib/services/ipfs';

// Upload a file
const result = await uploadFile(file, {
  filename: 'document.pdf',
  metadata: {
    type: 'legal-document',
    assetId: 'asset-123',
  },
});

// Upload JSON metadata
const metadataResult = await uploadJSON({
  name: 'Asset Name',
  description: 'Description',
  // ... other fields
}, {
  name: 'asset-metadata',
});
```

## File Categories and Limits

| Category | Max Size | Allowed Types |
|----------|----------|---------------|
| IMAGE | 10 MB | JPEG, PNG, GIF, WebP, SVG |
| VIDEO | 100 MB | MP4, WebM, QuickTime |
| DOCUMENT | 20 MB | PDF, DOC, DOCX, XLS, XLSX, TXT |
| METADATA | 1 MB | JSON |

## Environment Variables

Required environment variables in `.env`:

```env
PINATA_JWT=your_pinata_jwt_token
PINATA_GATEWAY=your-gateway.mypinata.cloud
```

## Security Features

1. **File Validation**
   - Size limits enforcement
   - MIME type checking
   - Filename sanitization

2. **Virus Scanning**
   - Placeholder implementation included
   - Ready for integration with ClamAV or VirusTotal

3. **Rate Limiting**
   - Upload endpoints are rate-limited
   - Prevents abuse and ensures fair usage

4. **Content Hashing**
   - SHA-256 hashing for verification
   - Immutable proof of authenticity

## Database Schema

### IpfsUpload Model

```prisma
model IpfsUpload {
  id          String       @id @default(uuid())
  ipfsHash    String       @unique
  gatewayUrl  String
  fileSize    Int
  fileName    String
  mimeType    String
  category    FileCategory
  uploadedAt  DateTime     @default(now())
  pinStatus   PinStatus    @default(PINNED)
  metadata    Json?
  userId      String
  assetId     String?
}
```

## Error Handling

All IPFS operations include comprehensive error handling:

```typescript
try {
  const result = await uploadFile(file);
} catch (error) {
  if (error instanceof ApiError) {
    console.error('Upload failed:', error.message);
    // Handle specific error
  }
}
```

## Best Practices

1. **Always validate files before upload**
   ```typescript
   const validation = validateFile(file, 'IMAGE');
   if (!validation.valid) {
     throw new Error(validation.errors.join(', '));
   }
   ```

2. **Use retry logic for critical uploads**
   ```typescript
   const result = await uploadWithRetry(
     () => uploadFile(file),
     3, // max retries
     1000 // delay in ms
   );
   ```

3. **Store IPFS hashes in database**
   - Always maintain a database record of uploads
   - Include metadata for searchability
   - Track pin status

4. **Use gateway URLs for frontend display**
   ```typescript
   const gatewayUrl = convertToGatewayUrl(ipfsHash);
   ```

## Migration Guide

To migrate the database schema:

```bash
npx prisma migrate dev --name add_ipfs_tracking
npx prisma generate
```

## Testing

Example test for file upload:

```typescript
describe('IPFS Upload', () => {
  it('should upload file successfully', async () => {
    const file = new File(['content'], 'test.pdf', {
      type: 'application/pdf',
    });

    const result = await uploadFile(file, {
      filename: 'test.pdf',
    });

    expect(result.ipfsHash).toBeDefined();
    expect(result.gatewayUrl).toContain('ipfs');
  });
});
```

## Monitoring and Maintenance

1. **Monitor pin status**
   - Regularly check pin status of critical files
   - Set up alerts for unpinned content

2. **Track storage usage**
   - Monitor total storage used
   - Implement cleanup for old/unused files

3. **Backup strategy**
   - Maintain database backups
   - Consider multi-gateway redundancy

## Future Enhancements

1. **CDN Integration**
   - Add Cloudflare or similar CDN
   - Improve global access speeds

2. **Advanced Virus Scanning**
   - Integrate with VirusTotal API
   - Implement real-time threat detection

3. **Compression**
   - Auto-compress images before upload
   - Optimize file sizes

4. **Search Capabilities**
   - Full-text search on metadata
   - Advanced filtering options

## Support

For issues or questions:
- Check the error logs in the database
- Review Pinata dashboard for pin status
- Contact support with IPFS hash for debugging