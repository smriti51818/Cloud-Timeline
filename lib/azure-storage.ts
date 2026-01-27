import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol,
} from '@azure/storage-blob'
import { azureConfig } from './azure-config'
import { AppError } from './error-handler'
import { STORAGE_CONFIG } from './constants'

/**
 * Initialize Azure Blob Storage client
 */
const sharedKeyCredential = new StorageSharedKeyCredential(
  azureConfig.storage.accountName,
  azureConfig.storage.accountKey
)

export const blobServiceClient = new BlobServiceClient(
  `https://${azureConfig.storage.accountName}.blob.core.windows.net`,
  sharedKeyCredential
)

export const containerClient = blobServiceClient.getContainerClient(
  azureConfig.storage.containerName
)

/**
 * Ensures the container exists
 */
async function ensureContainerExists(): Promise<void> {
  try {
    await containerClient.createIfNotExists()
  } catch (error) {
    console.error('[STORAGE] Initialization failed:', error)
    throw new AppError('Storage service not available', 500, 'STORAGE_INIT_ERROR')
  }
}

/**
 * Upload a file to Azure Blob Storage
 */
export async function uploadFile(
  file: File,
  userId: string,
  entryId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    await ensureContainerExists()

    const folder = file.type.startsWith('image/')
      ? STORAGE_CONFIG.IMAGE_FOLDER
      : STORAGE_CONFIG.AUDIO_FOLDER

    const fileName = `${folder}/${userId}/${entryId}/${encodeURIComponent(file.name)}`
    const blockBlobClient = containerClient.getBlockBlobClient(fileName)

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    await blockBlobClient.uploadData(buffer, {
      blobHTTPHeaders: { blobContentType: file.type },
      onProgress: (p) => {
        if (onProgress) onProgress((p.loadedBytes / file.size) * 100)
      },
    })

    // We return the clean URL; we generate SAS tokens on-demand for security
    return blockBlobClient.url
  } catch (error) {
    console.error('[STORAGE] Upload failed:', error)
    throw new AppError('Failed to upload file', 500, 'STORAGE_UPLOAD_ERROR')
  }
}

/**
 * Delete a file from Azure Blob Storage
 */
export async function deleteFile(blobPath: string): Promise<void> {
  try {
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath)
    await blockBlobClient.deleteIfExists()
  } catch (error) {
    console.error('[STORAGE] Delete failed:', error)
    throw new AppError('Failed to delete file', 500, 'STORAGE_DELETE_ERROR')
  }
}

/**
 * Generate a short-lived SAS URL for reading a blob
 */
export function generateReadSasUrl(blobPath: string, expiryHours = STORAGE_CONFIG.SAS_TOKEN_EXPIRY_HOURS): string | undefined {
  try {
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath)

    const permissions = BlobSASPermissions.parse('r')
    const expiresOn = new Date()
    expiresOn.setHours(expiresOn.getHours() + expiryHours)

    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: azureConfig.storage.containerName,
        blobName: blobPath,
        permissions,
        startsOn: new Date(new Date().valueOf() - 5 * 60 * 1000), // Account for clock skew
        expiresOn,
        protocol: SASProtocol.Https,
      },
      sharedKeyCredential
    ).toString()

    return `${blockBlobClient.url}?${sasToken}`
  } catch (error) {
    console.warn(`[STORAGE] SAS generation failed for ${blobPath}`, error)
    return undefined
  }
}

/**
 * Helper to get clean blob URL
 */
export function getFileUrl(blobPath: string): string {
  return `https://${azureConfig.storage.accountName}.blob.core.windows.net/${azureConfig.storage.containerName}/${blobPath}`
}
