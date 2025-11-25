<script setup lang="ts">
import { ref } from 'vue'
import MicrophoneChecker from './components/MicrophoneChecker.vue'
import ObjectionHandler from './components/ObjectionHandler.vue'
import type { Objection } from './data/objections'
import type { EmotionPrediction } from './services/valence'
import { getEmoji } from './utils/emotions'

const detectedObjections = ref<Objection[]>([])
const currentEmotions = ref<EmotionPrediction[]>([])
const lastAnalysisTime = ref('')
const micStatus = ref('idle')

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
    currentEmotions.value = []
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
        <div
          v-if="micStatus === 'active'"
          class="rounded-2xl bg-white shadow-lg p-8 transition-all duration-300"
        >
          <div v-if="currentEmotions.length > 0">
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
            </div>
          </div>

          <!-- Waiting State -->
          <div v-else class="text-center text-gray-500 italic py-4">
            Waiting for analysis results... (Speak for at least 5 seconds)
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
