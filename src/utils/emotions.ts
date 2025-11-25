export const EMOTION_EMOJIS: Record<string, string> = {
  neutral: '😐',
  calm: '😌',
  happy: '😊',
  sad: '😔',
  angry: '😠',
  fear: '😨',
  disgust: '🤢',
  disgusted: '🤢',
  surprise: '😲',
  surprised: '😲',
  excitement: '🤩',
  frustration: '😤',
  boredom: '🥱',
  joy: '😂',
  interest: '🤔',
  nervous: '😬',
  irritated: '😒',
}

export function getEmoji(emotion: string): string {
  return EMOTION_EMOJIS[emotion.toLowerCase()] || '😐'
}
