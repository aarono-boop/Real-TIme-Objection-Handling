<script setup lang="ts">
import { ref, computed } from 'vue'
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

const TEST_AUDIO_FILES = [
  { name: 'Angry Sample 1', url: 'https://cdn.builder.io/o/assets%2F5aeb07ce25f84dbc869290880d07b71e%2Fd6e0a1bebf054d0abb94947a19e08566?alt=media&token=4eb568bd-6766-4728-94b0-e2f313238e16&apiKey=5aeb07ce25f84dbc869290880d07b71e' },
  { name: 'Happy Sample 1', url: 'https://cdn.builder.io/o/assets%2F5aeb07ce25f84dbc869290880d07b71e%2F9ce116e50e6f4613911ef1414ec0a874?alt=media&token=3f6bd714-f190-46e2-968e-4fe015adaebb&apiKey=5aeb07ce25f84dbc869290880d07b71e' },
  { name: 'Neutral Sample 1', url: 'https://cdn.builder.io/o/assets%2F5aeb07ce25f84dbc869290880d07b71e%2F0a6ab77722ce4b45aab97b4e4874bf41?alt=media&token=d93d8332-8ea5-4366-aa5a-69f47cdcfc72&apiKey=5aeb07ce25f84dbc869290880d07b71e' },
  { name: 'Neutral Sample 2', url: 'https://cdn.builder.io/o/assets%2F5aeb07ce25f84dbc869290880d07b71e%2F33f9c5e9bbee4babaf9b830fe0814f2b?alt=media&token=459cd761-f597-452c-a533-8c7bd0803e2f&apiKey=5aeb07ce25f84dbc869290880d07b71e' },
  { name: 'Sad Sample 1', url: 'https://cdn.builder.io/o/assets%2F5aeb07ce25f84dbc869290880d07b71e%2F8c9dd94ad33142cda0c50f95d5baf10b?alt=media&token=6fc7dcf8-1d84-4a39-9fb2-fba716554a91&apiKey=5aeb07ce25f84dbc869290880d07b71e' },
  { name: 'Happy Sample 2', url: 'https://cdn.builder.io/o/assets%2F5aeb07ce25f84dbc869290880d07b71e%2Fcb358efaa3c84a269e1472a17c84070e?alt=media&token=5991fb20-9bfa-4ae3-a5a2-a5db6f61cb04&apiKey=5aeb07ce25f84dbc869290880d07b71e' },
  { name: 'Neutral Sample 3', url: 'https://cdn.builder.io/o/assets%2F5aeb07ce25f84dbc869290880d07b71e%2F8ffeebba5c934429963de3e96f25adac?alt=media&token=feaaf775-5cd8-4198-8f44-ad34fc3f8811&apiKey=5aeb07ce25f84dbc869290880d07b71e' },
  { name: 'Happy Sample 3', url: 'https://cdn.builder.io/o/assets%2F5aeb07ce25f84dbc869290880d07b71e%2F437a47ee7da94afa8057d9e4b1ffd6a3?alt=media&token=90551f50-643f-4d66-9f61-132984533fc7&apiKey=5aeb07ce25f84dbc869290880d07b71e' },
  { name: 'Angry Sample 2', url: 'https://cdn.builder.io/o/assets%2F5aeb07ce25f84dbc869290880d07b71e%2F8d82f9ab8e254026b4fb5745489d2895?alt=media&token=6a4febbb-236b-46ee-befa-b793dfd79fd8&apiKey=5aeb07ce25f84dbc869290880d07b71e' },
  { name: 'Sad Sample 2', url: 'https://cdn.builder.io/o/assets%2F5aeb07ce25f84dbc869290880d07b71e%2F070f9d3aac4d4e2085dcff1551e8d1ed?alt=media&token=e22cfc5a-c4f3-4431-b112-820e54a81f91&apiKey=5aeb07ce25f84dbc869290880d07b71e' },
  { name: 'Sad Sample 3', url: 'https://cdn.builder.io/o/assets%2F5aeb07ce25f84dbc869290880d07b71e%2Fa485beceb337454c9e677032fb6d49d6?alt=media&token=19856467-8bb6-447b-be78-e89a77daae72&apiKey=5aeb07ce25f84dbc869290880d07b71e' },
]

const detectedObjections = ref<Objection[]>([])
const currentEmotions = ref<EmotionPrediction[]>([...DEFAULT_EMOTIONS])
const lastAnalysisTime = ref('')
const micStatus = ref('idle')
const isAnalyzingFile = ref(false)

const groupedAudioFiles = computed(() => {
  const groups: Record<string, typeof TEST_AUDIO_FILES> = {}
  TEST_AUDIO_FILES.forEach((file) => {
    const emotion = file.name.split(' ')[0]
    if (!groups[emotion]) {
      groups[emotion] = []
    }
    groups[emotion].push(file)
  })
  return groups
})

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
              <div class="grid grid-cols-2 gap-4">
                <div v-for="(files, emotion) in groupedAudioFiles" :key="emotion">
                  <h4 class="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{{ emotion }}</h4>
                  <div class="flex flex-col gap-2">
                    <button
                      v-for="(file, index) in files"
                      :key="index"
                      @click="playAndAnalyze(file.url)"
                      class="px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 rounded-md text-gray-700 transition-colors flex items-center gap-2 w-full text-left"
                      :disabled="isAnalyzingFile"
                    >
                      <span>▶️</span> {{ file.name.replace(emotion + ' ', '') }}
                    </button>
                  </div>
                </div>
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
