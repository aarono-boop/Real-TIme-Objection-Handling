export const EMOTION_EMOJIS: Record<string, string> = {
  neutral: '😐',
  calm: '😌',
  happy: '😊',
  sad: '😔',
  angry: '😠',
  fear: '😨',
  disgust: '🤢',
  surprise: '😲',
  excitement: '🤩',
  frustration: '😤',
  boredom: '🥱',
  joy: '😂',
  interest: '🤔',
}

export function getEmoji(emotion: string): string {
  return EMOTION_EMOJIS[emotion.toLowerCase()] || '😐'
}
