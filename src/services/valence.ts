export interface EmotionPrediction {
  emotion: string
  confidence: number
}

export interface ValenceResponse {
  result: EmotionPrediction[]
  // Add other fields if known, based on search result it returns primary emotion and confidence scores
}

const API_URL = '/api/valence/emotionprediction'

export async function analyzeEmotion(audioBlob: Blob, apiKey?: string): Promise<ValenceResponse | null> {
  const formData = new FormData()
  // Always use .wav extension as we are now sending WAV blobs
  formData.append('file', audioBlob, 'audio.wav')

  try {
    const headers: Record<string, string> = {}
    if (apiKey) {
      headers['x-api-key'] = apiKey
    }

    const response = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: formData,
    })

    // If the response body is already used, it might be due to a browser extension or devtools.
    // We can try to clone it first, but if it's already used, clone() will fail too.
    // Let's try to be as standard as possible.

    if (response.bodyUsed) {
       console.error('Response body was already used before we could read it.')
       throw new Error('Response body was already consumed')
    }

    const text = await response.text()

    if (!response.ok) {
      throw new Error(`Valence API error: ${response.status} ${response.statusText} - ${text}`)
    }

    let data: any
    try {
      data = JSON.parse(text)
    } catch (e) {
      console.warn('Received non-JSON response from Valence API:', text)
      return { result: [] }
    }

    // Normalize response structure
    if (Array.isArray(data)) {
      return { result: data }
    } else if (Array.isArray(data.result)) {
      return data
    } else if (Array.isArray(data.predictions)) {
      return { result: data.predictions }
    } else if (data.emotion && typeof data.confidence === 'number') {
      return { result: [data] }
    }

    console.warn('Unexpected Valence API response format:', data)
    return { result: [] }
  } catch (error) {
    console.error('Error analyzing emotion:', error)
    throw error
  }
}
