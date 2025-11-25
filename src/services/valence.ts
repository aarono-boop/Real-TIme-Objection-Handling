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

    // Use clone() to safely read the body if we suspect something else might be touching it,
    // though in this context it's unlikely. The error "body stream already read" is extremely specific.
    // It usually happens if we access .text() or .json() more than once.
    // We are only calling .text() once here.
    // Is it possible the browser devtools or a proxy interceptor is reading it?
    // Let's try to be extremely defensive.

    const clonedResponse = response.clone()
    let text = ''
    try {
      text = await response.text()
    } catch (e) {
      // If reading original fails, try clone? Or maybe it failed because it was already read?
      console.warn('Failed to read response text, trying clone', e)
      try {
         text = await clonedResponse.text()
      } catch (e2) {
         console.error('Failed to read response body from clone too', e2)
         throw new Error('Could not read response body')
      }
    }

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
