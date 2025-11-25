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

    // Clone the response to ensure we can read it multiple times if needed,
    // although we should only need to read it once.
    // The error "body stream already read" is very persistent, which implies
    // something else might be reading it, or the logic is still flawed.
    // Let's use a simpler approach: always read as text first, then try to parse as JSON.

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
