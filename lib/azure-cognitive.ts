import { ComputerVisionClient } from '@azure/cognitiveservices-computervision';
import type { VisualFeatureTypes } from '@azure/cognitiveservices-computervision/esm/models';
import { ApiKeyCredentials } from '@azure/ms-rest-js';
import { azureConfig } from './azure-config';
import { AITagResult, TranscriptionResult, SentimentResult } from './types';

// Use BASE_URL from environment or fallback to localhost
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// Computer Vision client for image analysis
const computerVisionClient = new ComputerVisionClient(
  new ApiKeyCredentials({
    inHeader: { 'Ocp-Apim-Subscription-Key': azureConfig.cognitive.vision.key },
  }),
  azureConfig.cognitive.vision.endpoint
);

export async function analyzeImage(imageUrl: string): Promise<AITagResult> {
  try {
    // If the image is in Azure Blob Storage (or other URLs that may be inaccessible
    // to the Cognitive service), fetch the bytes server-side and analyze the stream
    // directly to avoid upstream fetch issues like "url parameter is valid but upstream response is invalid".
    const isBlobUrl = imageUrl.includes('.blob.core.windows.net')

    let result: any

    if (isBlobUrl) {
      try {
        const resp = await fetch(imageUrl)
        if (!resp.ok) throw new Error(`Failed to fetch image for analysis: ${resp.status}`)

        const arrayBuffer = await resp.arrayBuffer()
        // convert to Node readable stream
        const { Readable } = await import('stream')
        const buffer = Buffer.from(arrayBuffer)
        const stream = Readable.from(buffer)

        // analyze image from stream
        // cast stream to any to satisfy SDK HttpRequestBody typing in Node
        result = await computerVisionClient.analyzeImageInStream(stream as any, {
          visualFeatures: ['Tags', 'Description', 'Categories'] as VisualFeatureTypes[],
        })
      } catch (err) {
        console.error('Error fetching blob for analysis, falling back to URL analyze:', err)
        // fall back to URL-based analyze
        result = await computerVisionClient.analyzeImage(imageUrl, {
          visualFeatures: ['Tags', 'Description', 'Categories'] as VisualFeatureTypes[],
        })
      }
    } else {
      result = await computerVisionClient.analyzeImage(imageUrl, {
        visualFeatures: ['Tags', 'Description', 'Categories'] as VisualFeatureTypes[],
      })
    }

  const tags = (result.tags?.map((t: any) => (t && t.name) || '').filter((n: string): n is string => Boolean(n)) ) ?? [];
  const category = result.categories?.[0]?.name || 'general';
  const confidence = result.tags?.[0]?.confidence || 0;

    return { tags, confidence, category };
  } catch (error) {
    console.error('Error analyzing image:', error);
    return { tags: ['image'], confidence: 0, category: 'general' };
  }
}

export async function transcribeAudio(audioUrl: string): Promise<TranscriptionResult> {
  try {
    const response = await fetch(`${BASE_URL}/api/transcribe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioUrl }),
    });

    if (!response.ok) throw new Error('Transcription failed');

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error transcribing audio:', error);
    return { text: 'Transcription failed', confidence: 0, language: 'en' };
  }
}

export async function analyzeSentiment(text: string): Promise<SentimentResult> {
  try {
    const response = await fetch(`${BASE_URL}/api/analyze-sentiment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) throw new Error('Sentiment analysis failed');

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Error analyzing sentiment:', error);
    return {
      sentiment: 'neutral',
      confidence: 0,
      scores: { positive: 0.33, negative: 0.33, neutral: 0.34 },
    };
  }
}

export async function categorizeText(text: string): Promise<string[]> {
  try {
    const response = await fetch(`${BASE_URL}/api/categorize-text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) throw new Error('Text categorization failed');

    const result = await response.json();
    return result.categories || ['general'];
  } catch (error) {
    console.error('Error categorizing text:', error);
    return ['general'];
  }
}
