export interface EmotionPrediction {
  emotion: string
  confidence: number
}

export interface ValenceResponse {
  result: EmotionPrediction[]
  // Add other fields if known, based on search result it returns primary emotion and confidence scores
}

const API_URL = '/api/valence/emotionprediction'

export async function analyzeEmotion(
  audioBlob: Blob,
  apiKey?: string,
): Promise<ValenceResponse | null> {
  const formData = new FormData()
  // Always use .wav extension as we are now sending WAV blobs
  formData.append('file', audioBlob, 'audio.wav')
  // Try passing the model parameter in FormData
  formData.append('emotion_model', '7-emotion-model')
  formData.append('model', '7-emotion-model')

  try {
    const headers: Record<string, string> = {}
    if (apiKey) {
      headers['x-api-key'] = apiKey
    }

    // Also append to URL as a query parameter to be safe
    const url = new URL(API_URL, window.location.origin)
    url.searchParams.append('emotion_model', '7-emotion-model')
    url.searchParams.append('model', '7-emotion-model')

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers,
      body: formData,
    })

    // If the response body is already used, it might be due to a browser extension or devtools.
    if (response.bodyUsed) {
      console.warn('Response body was already consumed (likely by browser extension).')
      if (!response.ok) {
        throw new Error(
          `Valence API error: ${response.status} ${response.statusText} (Body consumed by extension)`,
        )
      }
      // If it was successful but consumed, we can't do much.
      return { result: [] }
    }

    const text = await response.text()

    if (!response.ok) {
      throw new Error(`Valence API error: ${response.status} ${response.statusText} - ${text}`)
    }

    let data: any
    try {
      data = JSON.parse(text)
      console.log('Valence API Raw Response:', data)
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
    } else if (data.all_predictions && typeof data.all_predictions === 'object') {
      // Handle format: { all_predictions: { angry: 0.2, happy: 0.3 }, main_emotion: 'happy', confidence: 0.3 }
      const predictions: EmotionPrediction[] = Object.entries(data.all_predictions).map(
        ([emotion, confidence]) => ({
          emotion,
          confidence: Number(confidence),
        }),
      )
      return { result: predictions }
    }

    console.warn('Unexpected Valence API response format:', data)
    // Return the raw data wrapped so we can see it in the debug UI
    return { result: [], raw: data } as any
  } catch (error) {
    console.error('Error analyzing emotion:', error)
    throw error
  }
}
