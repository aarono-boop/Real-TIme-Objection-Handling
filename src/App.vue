<script setup lang="ts">
import { ref } from 'vue'
import MicrophoneChecker from './components/MicrophoneChecker.vue'
import ObjectionHandler from './components/ObjectionHandler.vue'
import type { Objection } from './data/objections'
import { analyzeEmotion, type EmotionPrediction } from './services/valence'
import { getEmoji } from './utils/emotions'

const DEFAULT_EMOTIONS: EmotionPrediction[] = [
  { emotion: 'happy', confidence: 0 },
  { emotion: 'sad', confidence: 0 },
  { emotion: 'angry', confidence: 0 },
  { emotion: 'neutral', confidence: 0 },
]

const detectedObjections = ref<Objection[]>([])
const currentEmotions = ref<EmotionPrediction[]>([...DEFAULT_EMOTIONS])
const lastAnalysisTime = ref('')
const micStatus = ref('idle')
const isAnalyzingFile = ref(false)

async function playAndAnalyze(url: string) {
  try {
    isAnalyzingFile.value = true

    // Play audio
    const audio = new Audio(url)
    audio.play()

    // Fetch and analyze
    const response = await fetch(url)
    const blob = await response.blob()

    const result = await analyzeEmotion(blob)

    if (result && result.result) {
       const sortedEmotions = result.result.sort((a, b) => b.confidence - a.confidence)
       currentEmotions.value = sortedEmotions
       lastAnalysisTime.value = new Date().toLocaleTimeString()

       // Reset to 0 after 5 seconds (matching the chunk duration)
       setTimeout(() => {
         currentEmotions.value = currentEmotions.value.map(e => ({ ...e, confidence: 0 }))
       }, 5000)
    }
  } catch (e) {
    console.error('Error analyzing file:', e)
  } finally {
    isAnalyzingFile.value = false
  }
}

function onObjectionDetected(objection: Objection) {
  if (!detectedObjections.value.find((o) => o.id === objection.id)) {
    detectedObjections.value.push(objection)
  }
}

function onEmotionsUpdated(emotions: EmotionPrediction[], timestamp: string) {
  currentEmotions.value = emotions
  lastAnalysisTime.value = timestamp
}

function onStatusChanged(status: string) {
  micStatus.value = status
  if (status === 'idle') {
    currentEmotions.value = [...DEFAULT_EMOTIONS]
    lastAnalysisTime.value = ''
  }
}

function clearObjections() {
  detectedObjections.value = []
}

function removeObjection(objectionId: string) {
  detectedObjections.value = detectedObjections.value.filter((o) => o.id !== objectionId)
}
</script>

<template>
  <div
    class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-8 px-4 sm:py-12 sm:px-6"
  >
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-7xl mx-auto">
      <!-- Left column: Microphone Checker -->
      <div>
        <MicrophoneChecker
          @objection-detected="onObjectionDetected"
          @emotions-updated="onEmotionsUpdated"
          @status-changed="onStatusChanged"
        />
      </div>

      <!-- Right column: Objection Handler -->
      <div class="flex flex-col gap-6">
        <!-- Emotion Detection Panel -->
        <div class="rounded-2xl bg-white shadow-lg p-8 transition-all duration-300">
          <div>
            <div class="flex justify-between items-center mb-4">
              <div>
                <h2 class="text-2xl font-bold text-gray-900">Emotion Detection</h2>
                <p class="text-sm text-gray-500 mt-1">
                  Confidence scores based on the last 5s of audio
                </p>
              </div>
              <span v-if="lastAnalysisTime" class="text-xs text-gray-500"
                >Updated: {{ lastAnalysisTime }}</span
              >
            </div>

            <div class="grid grid-cols-2 gap-4">
              <div
                v-for="emotion in currentEmotions"
                :key="emotion.emotion"
                class="bg-gray-50 p-4 rounded-lg border border-gray-100 transition-all duration-300 hover:shadow-md"
              >
                <div class="flex justify-between items-center mb-2">
                  <div class="flex items-center gap-2">
                    <span class="text-2xl" role="img" :aria-label="emotion.emotion">{{
                      getEmoji(emotion.emotion)
                    }}</span>
                    <p class="font-semibold capitalize text-gray-900">{{ emotion.emotion }}</p>
                  </div>
                  <span class="text-xs font-mono text-gray-500"
                    >{{ Math.round(emotion.confidence * 100) }}%</span
                  >
                </div>
                <div class="w-full bg-gray-200 rounded-full h-2">
                  <div
                    class="bg-blue-600 h-2 rounded-full transition-all duration-500"
                    :style="{ width: `${emotion.confidence * 100}%` }"
                  ></div>
                </div>
            </div>

            <div class="mt-6 pt-6 border-t border-gray-100">
              <h3 class="text-sm font-semibold text-gray-900 mb-3">Test Audio Files</h3>
              <div class="flex gap-3">
                <button
                  @click="playAndAnalyze('https://cdn.builder.io/o/assets%2F5aeb07ce25f84dbc869290880d07b71e%2Fd6e0a1bebf054d0abb94947a19e08566?alt=media&token=4eb568bd-6766-4728-94b0-e2f313238e16&apiKey=5aeb07ce25f84dbc869290880d07b71e')"
                  class="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors flex items-center gap-2"
                  :disabled="isAnalyzingFile"
                >
                  <span>▶️</span> Play Sample 1
                </button>
                <button
                  @click="playAndAnalyze('https://cdn.builder.io/o/assets%2F5aeb07ce25f84dbc869290880d07b71e%2F9ce116e50e6f4613911ef1414ec0a874?alt=media&token=3f6bd714-f190-46e2-968e-4fe015adaebb&apiKey=5aeb07ce25f84dbc869290880d07b71e')"
                  class="px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors flex items-center gap-2"
                  :disabled="isAnalyzingFile"
                >
                  <span>▶️</span> Play Sample 2
                </button>
              </div>
              <p v-if="isAnalyzingFile" class="text-xs text-blue-600 mt-2 animate-pulse">Analyzing audio file (Emotion Analysis Only)...</p>
            </div>
          </div>
        </div>
        </div>

        <ObjectionHandler
          :detected-objections="detectedObjections"
          @clear="clearObjections"
          @removeObjection="removeObjection"
        />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
