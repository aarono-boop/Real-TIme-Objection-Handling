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

    if (!response.ok) {
      // Clone response before reading text() to avoid "body stream already read" if we need to read it again or if logic changes
      // But here the issue is likely that response.json() is called after response.text() on the same response object if we are not careful.
      // Wait, if response.ok is false, we read text() and throw. We don't reach response.json().
      // If response.ok is true, we go to response.json().
      // The error "body stream already read" suggests something is reading the body twice.
      // Ah, maybe the error is happening in the catch block or somewhere else?
      // Or maybe the browser/proxy is doing something weird?
      // Let's just read text() if not ok, and json() if ok. They are mutually exclusive here.

      // Wait, looking at the code:
      // if (!response.ok) { const errorText = await response.text(); throw ... }
      // const data = await response.json()

      // This looks correct. UNLESS response.ok is true but for some reason we are reading it twice?
      // Or maybe the error is coming from the fetch itself? No, "body stream already read" usually comes from consuming the body.

      // Let's try to be safer.
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
         const data = await response.json()
         if (!response.ok) {
             throw new Error(`Valence API error: ${response.status} ${response.statusText} - ${JSON.stringify(data)}`)
         }

         // Normalize response structure (same logic as before)
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
      } else {
         const text = await response.text()
         if (!response.ok) {
             throw new Error(`Valence API error: ${response.status} ${response.statusText} - ${text}`)
         }
         // If ok but not json?
         console.warn('Received non-JSON response from Valence API:', text)
         return { result: [] }
      }
    }

    // Fallback if logic above is skipped (it won't be)
    return { result: [] }
  } catch (error) {
    console.error('Error analyzing emotion:', error)
    throw error
  }
}
