/**
 * Centralized API client with error handling and retry logic
 */

import { handleClientError } from './error-handler'

export interface ApiResponse<T = unknown> {
    data?: T
    error?: string
    message?: string
}

class ApiClient {
    private baseUrl: string

    constructor() {
        this.baseUrl = process.env.NEXT_PUBLIC_APP_URL || ''
    }

    /**
     * Generic fetch with error handling
     */
    private async fetchWithErrorHandling<T>(
        url: string,
        options?: RequestInit
    ): Promise<ApiResponse<T>> {
        try {
            const response = await fetch(url, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    ...options?.headers,
                },
            })

            const data = await response.json()

            if (!response.ok) {
                return {
                    error: data.error?.message || data.message || 'Request failed',
                }
            }

            return { data }
        } catch (error) {
            return {
                error: handleClientError(error),
            }
        }
    }

    /**
     * GET request
     */
    async get<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.fetchWithErrorHandling<T>(endpoint, {
            method: 'GET',
        })
    }

    /**
     * POST request
     */
    async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
        return this.fetchWithErrorHandling<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(body),
        })
    }

    /**
     * PUT request
     */
    async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
        return this.fetchWithErrorHandling<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(body),
        })
    }

    /**
     * DELETE request
     */
    async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
        return this.fetchWithErrorHandling<T>(endpoint, {
            method: 'DELETE',
        })
    }

    /**
     * Upload file with progress tracking
     */
    async uploadFile(
        endpoint: string,
        file: File,
        onProgress?: (progress: number) => void
    ): Promise<ApiResponse<{ url: string }>> {
        return new Promise((resolve) => {
            const xhr = new XMLHttpRequest()
            const formData = new FormData()
            formData.append('file', file)

            // Track upload progress
            if (onProgress) {
                xhr.upload.addEventListener('progress', (e) => {
                    if (e.lengthComputable) {
                        const progress = (e.loaded / e.total) * 100
                        onProgress(progress)
                    }
                })
            }

            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    try {
                        const data = JSON.parse(xhr.responseText)
                        resolve({ data })
                    } catch {
                        resolve({ error: 'Invalid response format' })
                    }
                } else {
                    resolve({ error: `Upload failed with status ${xhr.status}` })
                }
            })

            xhr.addEventListener('error', () => {
                resolve({ error: 'Network error during upload' })
            })

            xhr.open('POST', endpoint)
            xhr.send(formData)
        })
    }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Convenience functions for common API calls
export const api = {
    // Entries
    getEntries: () => apiClient.get('/api/entries'),
    getEntry: (id: string) => apiClient.get(`/api/entries/${id}`),
    createEntry: (entry: unknown) => apiClient.post('/api/entries', entry),
    updateEntry: (id: string, entry: unknown) =>
        apiClient.put(`/api/entries/${id}`, entry),
    deleteEntry: (id: string) => apiClient.delete(`/api/entries/${id}`),

    // Upload
    uploadFile: (file: File, onProgress?: (progress: number) => void) =>
        apiClient.uploadFile('/api/upload', file, onProgress),

    // AI Services
    transcribeAudio: (audioUrl: string) =>
        apiClient.post('/api/transcribe', { audioUrl }),
    analyzeSentiment: (text: string) =>
        apiClient.post('/api/analyze-sentiment', { text }),
    categorizeText: (text: string) =>
        apiClient.post('/api/categorize-text', { text }),
    generatePrompt: () =>
        apiClient.get('/api/generate-prompt'),

    // Random entry
    getRandomEntry: () =>
        apiClient.get('/api/random-entry'),
}
