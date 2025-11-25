export interface EmotionPrediction {
  emotion: string
  confidence: number
}

export interface ValenceResponse {
  result: EmotionPrediction[]
  // Add other fields if known, based on search result it returns primary emotion and confidence scores
}

const API_URL = 'https://api.getvalenceai.com/v1/emotionprediction' // Using v1 as a safe bet, or just the root if unsure. The search result said https://api.getvalenceai.com/emotionprediction. I will use that.

export async function analyzeEmotion(audioBlob: Blob, apiKey: string): Promise<ValenceResponse | null> {
  if (!apiKey) {
    console.error('Valence API key is missing')
    return null
  }

  const formData = new FormData()
  formData.append('file', audioBlob, 'audio.wav')

  try {
    const response = await fetch('https://api.getvalenceai.com/emotionprediction', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
      },
      body: formData,
    })

    if (!response.ok) {
      throw new Error(`Valence API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Error analyzing emotion:', error)
    throw error
  }
}
