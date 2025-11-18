'use client'

import { ChangeEvent, useRef } from 'react'
import { Loader2, UploadCloud } from 'lucide-react'

export interface UploadedDocumentPreview {
  id?: string
  name: string
  version?: number
  fileSize: number
  ipfsHash: string
}

interface DocumentUploadCardProps {
  title: string
  description: string
  requirementId: string
  accept?: string
  document?: UploadedDocumentPreview | null
  isUploading?: boolean
  onFileSelected: (file: File) => Promise<void>
}

export function DocumentUploadCard({
  title,
  description,
  requirementId,
  accept,
  document,
  isUploading,
  onFileSelected,
}: DocumentUploadCardProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await onFileSelected(file)
    // reset so same file can be uploaded again if needed
    event.target.value = ''
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-1 text-sm text-gray-500">{description}</p>
        </div>
        {document && (
          <span className="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
            Uploaded v{document.version ?? 1}
          </span>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-6 text-center">
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          onChange={handleFileChange}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="inline-flex items-center gap-2 rounded-full border border-black px-4 py-2 text-sm font-semibold text-black transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Uploading
            </>
          ) : (
            <>
              <UploadCloud className="h-4 w-4" />
              {document ? 'Replace document' : 'Upload document'}
            </>
          )}
        </button>

        {document && (
          <div className="mt-4 text-sm text-gray-500">
            <p>{document.name}</p>
            <p>{(document.fileSize / 1024 / 1024).toFixed(2)} MB • IPFS: {document.ipfsHash.slice(0, 10)}...</p>
          </div>
        )}
      </div>
    </div>
  )
}

