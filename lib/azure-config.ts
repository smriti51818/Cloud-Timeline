// Azure service configuration
export const azureConfig = {
  storage: {
    accountName: process.env.AZURE_STORAGE_ACCOUNT || '',
    accountKey: process.env.AZURE_STORAGE_KEY || '',
    connectionString: process.env.AZURE_STORAGE_CONNECTION_STRING || '',
    containerName: 'timeline-media',
  },
  cosmos: {
    endpoint: process.env.AZURE_COSMOS_ENDPOINT || '',
    key: process.env.AZURE_COSMOS_KEY || '',
    databaseId: process.env.AZURE_COSMOS_DATABASE || 'timeline-db',
    containerId: process.env.AZURE_COSMOS_CONTAINER || 'timeline-entries',
  },
  cognitive: {
    vision: {
      key: process.env.AZURE_COGNITIVE_VISION_KEY || '',
      endpoint: process.env.AZURE_COGNITIVE_VISION_ENDPOINT || '',
    },
    speech: {
      key: process.env.AZURE_COGNITIVE_SPEECH_KEY || '',
      region: process.env.AZURE_COGNITIVE_SPEECH_REGION || '',
    },
    text: {
      key: process.env.AZURE_COGNITIVE_TEXT_KEY || '',
      endpoint: process.env.AZURE_COGNITIVE_TEXT_ENDPOINT || '',
    },
  },
}
