import {
  BlobServiceClient,
  StorageSharedKeyCredential,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol,
} from '@azure/storage-blob'
import { azureConfig } from './azure-config'

// Initialize Azure Blob Storage client
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

// Ensure container exists (private by default)
async function ensureContainerExists(): Promise<void> {
  try {
  // Create the container if it doesn't exist (do not request public access here because
  // some storage accounts disallow public access at the account level)
  await containerClient.createIfNotExists()
    // Also ensure existing container has blob-level public access so images can be served
    try {
      // setAccessPolicy will set the public access level for the container
      // If the container already has the desired access level this is a no-op
      // Note: this requires the storage account key (we have StorageSharedKeyCredential)
      // Type annotation avoided to prevent import changes; SDK accepts 'blob' as PublicAccessType
      // @ts-ignore
      await containerClient.setAccessPolicy('blob')
    } catch (innerErr) {
      // If setting access policy fails, log but continue; uploads may still work for authenticated clients
      console.warn('Could not set container access policy to blob:', innerErr)
    }

    console.log(`Container "${azureConfig.storage.containerName}" is ready and accessible`)
  } catch (e) {
    console.error('ensureContainerExists error', e)
    throw new Error('Storage container is not available')
  }
}

export async function uploadFile(
  file: File,
  userId: string,
  entryId: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    if (!azureConfig.storage.accountName || !azureConfig.storage.accountKey) {
      throw new Error('Storage credentials are not configured')
    }

    await ensureContainerExists()

    const fileName = `${userId}/${entryId}/${file.name}`
    const blockBlobClient = containerClient.getBlockBlobClient(fileName)
    
    const uploadOptions = {
      blobHTTPHeaders: {
        blobContentType: file.type,
      },
      onProgress: (progress: any) => {
        if (onProgress) {
          onProgress((progress.loadedBytes / file.size) * 100)
        }
      },
    }

    // Convert web File to Buffer for Node upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    await blockBlobClient.uploadData(buffer, uploadOptions)
    
    // Generate a long-lived SAS URL (1 year) so the file can be read by clients
    try {
      const expiresOn = new Date(new Date().valueOf() + 8760 * 60 * 60 * 1000) // 1 year
      const permissions = BlobSASPermissions.parse('r')
      const sasToken = generateBlobSASQueryParameters(
        {
          containerName: azureConfig.storage.containerName,
          blobName: fileName,
          permissions,
          startsOn: new Date(new Date().valueOf() - 5 * 60 * 1000), // 5 minutes ago to avoid clock skew
          expiresOn,
          protocol: SASProtocol.Https,
        } as any,
        sharedKeyCredential
      ).toString()

      return `${blockBlobClient.url}?${sasToken}`
    } catch (sasErr) {
      // If SAS generation fails (e.g., missing credentials), fall back to returning the plain URL.
      console.warn('Could not generate SAS for blob, returning plain URL:', sasErr)
      return blockBlobClient.url
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    const message = error instanceof Error ? error.message : 'Failed to upload file'
    throw new Error(message)
  }
}

export async function deleteFile(fileUrl: string): Promise<void> {
  try {
    const url = new URL(fileUrl)
    const pathParts = url.pathname.split('/')
    const containerName = pathParts[1]
    const blobName = pathParts.slice(2).join('/')
    
    const containerClient = blobServiceClient.getContainerClient(containerName)
    const blockBlobClient = containerClient.getBlockBlobClient(blobName)
    
    await blockBlobClient.delete()
  } catch (error) {
    console.error('Error deleting file:', error)
    throw new Error('Failed to delete file')
  }
}

export function getFileUrl(fileName: string): string {
  return `https://${azureConfig.storage.accountName}.blob.core.windows.net/${azureConfig.storage.containerName}/${fileName}`
}

// Generate a read-only SAS URL for an existing blob. Returns the SAS URL or undefined on failure.
export function generateReadSasUrl(blobPath: string, hours = 8760): string | undefined {
  try {
    if (!azureConfig.storage.accountName || !azureConfig.storage.accountKey) {
      console.warn('Storage credentials not available for SAS generation')
      return undefined
    }

    const blobUrl = `https://${azureConfig.storage.accountName}.blob.core.windows.net/${azureConfig.storage.containerName}/${blobPath}`
    // Create a BlockBlobClient to access the URL
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath)

    const expiresOn = new Date(new Date().valueOf() + hours * 60 * 60 * 1000)
    const permissions = BlobSASPermissions.parse('r')
    const sasToken = generateBlobSASQueryParameters(
      {
        containerName: azureConfig.storage.containerName,
        blobName: blobPath,
        permissions,
        startsOn: new Date(new Date().valueOf() - 5 * 60 * 1000),
        expiresOn,
        protocol: SASProtocol.Https,
      } as any,
      sharedKeyCredential
    ).toString()

    return `${blockBlobClient.url}?${sasToken}`
  } catch (err) {
    console.warn('Failed to generate read SAS URL for blob', blobPath, err)
    return undefined
  }
}
