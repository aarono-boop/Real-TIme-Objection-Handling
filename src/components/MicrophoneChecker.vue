<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { OBJECTIONS } from '../data/objections'
import type { Objection } from '../data/objections'

type MicStatus = 'idle' | 'requesting' | 'active' | 'error'

const emit = defineEmits<{
  objectionDetected: [objection: Objection]
}>()

const status = ref<MicStatus>('idle')
const errorMessage = ref('')
const audioLevel = ref(0)
const stream = ref<MediaStream | null>(null)
const analyser = ref<AnalyserNode | null>(null)
const animationFrameId = ref<number | null>(null)
const deviceName = ref('')
const isMinimized = ref(false)

const interimTranscript = ref('')
const finalTranscript = ref('')
const transcriptionError = ref('')
const isTranscribing = ref(false)
const detectedObjectionsSet = ref<Set<string>>(new Set())
let recognition: (SpeechRecognition & any) | null = null

function detectObjections(text: string) {
  if (!text || text.length < 3) return

  const lowerText = text.toLowerCase()

  for (const objection of OBJECTIONS) {
    if (detectedObjectionsSet.value.has(objection.id)) continue

    for (const keyword of objection.keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        detectedObjectionsSet.value.add(objection.id)
        emit('objectionDetected', objection)
        break
      }
    }
  }
}

async function requestMicrophoneAccess() {
  try {
    status.value = 'requesting'
    errorMessage.value = ''

    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false,
      },
    })

    stream.value = mediaStream

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const source = audioContext.createMediaStreamSource(mediaStream)
    const newAnalyser = audioContext.createAnalyser()
    newAnalyser.fftSize = 256

    source.connect(newAnalyser)
    analyser.value = newAnalyser

    const deviceLabel = mediaStream.getAudioTracks()[0]?.label || 'Microphone'
    deviceName.value = deviceLabel

    status.value = 'active'
    monitorAudioLevel()
    initializeTranscription()
  } catch (error) {
    status.value = 'error'
    if (error instanceof DOMException) {
      if (error.name === 'NotAllowedError') {
        errorMessage.value =
          'Microphone access was denied. Please enable microphone permissions in your browser settings.'
      } else if (error.name === 'NotFoundError') {
        errorMessage.value =
          'No microphone device found. Please connect a microphone and try again.'
      } else {
        errorMessage.value = `Microphone error: ${error.message}`
      }
    } else {
      errorMessage.value = 'An unexpected error occurred. Please try again.'
    }
  }
}

function monitorAudioLevel() {
  if (!analyser.value) return

  const dataArray = new Uint8Array(analyser.value.frequencyBinCount)
  analyser.value.getByteFrequencyData(dataArray)

  let sum = 0
  for (let i = 0; i < dataArray.length; i++) {
    sum += dataArray[i]
  }
  const average = sum / dataArray.length
  audioLevel.value = average

  animationFrameId.value = requestAnimationFrame(monitorAudioLevel)
}

function stopMicrophone() {
  if (stream.value) {
    stream.value.getTracks().forEach((track) => track.stop())
    stream.value = null
  }

  if (animationFrameId.value) {
    cancelAnimationFrame(animationFrameId.value)
    animationFrameId.value = null
  }

  analyser.value = null
  audioLevel.value = 0
  status.value = 'idle'
  errorMessage.value = ''
  deviceName.value = ''
  stopTranscription()
  detectedObjectionsSet.value.clear()
}

function restartRecognition() {
  if (status.value !== 'active' || !recognition) {
    isTranscribing.value = false
    return
  }

  try {
    recognition.start()
  } catch (e) {}
}

function initializeTranscription() {
  const SpeechRecognition = (window as any).webkitSpeechRecognition || window.SpeechRecognition

  if (!SpeechRecognition) {
    transcriptionError.value = 'Speech Recognition is not supported in your browser'
    return
  }

  if (recognition) {
    try {
      recognition.abort()
    } catch (e) {}
  }

  recognition = new SpeechRecognition()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = 'en-US'

  recognition.onstart = () => {
    isTranscribing.value = true
    transcriptionError.value = ''
    console.log('[Transcription] Started listening')
  }

  let lastInterimWasEmpty = false

  recognition.onresult = (event: any) => {
    console.log('[Transcription] Result event received', event.results.length)
    let interim = ''
    let finalText = ''

    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript

      if (event.results[i].isFinal) {
        finalText += transcript + ' '
      } else {
        interim += transcript
      }
    }

    if (finalText) {
      const isInterimEmpty = interim.trim() === ''

      if (lastInterimWasEmpty && finalTranscript.value && !finalTranscript.value.endsWith('\n')) {
        finalTranscript.value = finalTranscript.value.trimEnd() + '\n'
        finalText = finalText.trimStart()
      }

      if ((finalTranscript.value.endsWith('\n') || finalTranscript.value === '') && finalText.length > 0) {
        finalText = finalText.charAt(0).toUpperCase() + finalText.slice(1)
      }

      finalTranscript.value += finalText
      detectObjections(finalText)
      console.log('[Transcription] Final:', finalText)

      lastInterimWasEmpty = isInterimEmpty
    }

    interimTranscript.value = interim
    detectObjections(interim)
  }

  recognition.onerror = (event: any) => {
    console.log('[Transcription] Error:', event.error)

    if (event.error === 'no-speech') {
      console.log('[Transcription] No speech detected, continuing to listen')
    } else if (event.error !== 'network' && event.error !== 'audio-capture') {
      transcriptionError.value = `Error: ${event.error}`
    }
  }

  recognition.onend = () => {
    console.log('[Transcription] Recognition ended, status:', status.value)
    if (status.value === 'active') {
      if (finalTranscript.value && !finalTranscript.value.endsWith('\n')) {
        finalTranscript.value += '\n'
      }
      setTimeout(() => {
        console.log('[Transcription] Restarting...')
        try {
          recognition.start()
        } catch (e) {
          console.error('[Transcription] Error restarting:', e)
        }
      }, 300)
    } else {
      isTranscribing.value = false
    }
  }

  isTranscribing.value = true
  transcriptionError.value = ''

  try {
    console.log('[Transcription] Starting recognition')
    recognition.start()
  } catch (e) {
    console.error('[Transcription] Error starting:', e)
  }
}

function stopTranscription() {
  if (recognition) {
    recognition.stop()
    recognition = null
  }
  isTranscribing.value = false
  interimTranscript.value = ''
}

function clearTranscript() {
  finalTranscript.value = ''
  interimTranscript.value = ''
}

onMounted(() => {})

onBeforeUnmount(() => {
  stopMicrophone()
})
</script>

<template>
  <div class="w-full max-w-2xl mx-auto">
    <div class="rounded-2xl bg-white shadow-lg overflow-hidden transition-all duration-300">
      <!-- Header with Minimize Button -->
      <div class="p-6 sm:p-8 flex items-center justify-between">
        <div v-if="!isMinimized" class="flex-1">
          <h1 class="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Microphone Checker</h1>
          <p class="text-gray-600 text-sm">Test your microphone and monitor audio input levels</p>
        </div>
        <div v-else class="flex-1">
          <h1 class="text-xl font-bold text-gray-900">Microphone Checker</h1>
          <p v-if="status === 'active'" class="text-sm text-green-600 font-medium mt-1">Active</p>
          <p v-else class="text-sm text-gray-600 mt-1">Ready to test</p>
        </div>

        <button
          @click="isMinimized = !isMinimized"
          class="ml-4 p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex-shrink-0"
          :title="isMinimized ? 'Expand' : 'Minimize'"
        >
          <svg
            v-if="isMinimized"
            class="w-6 h-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M5 15l7-7 7 7"
            />
          </svg>
          <svg
            v-else
            class="w-6 h-6 text-gray-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>
      </div>

      <!-- Main Content (Collapsible) -->
      <div v-if="!isMinimized" style="padding: 0 48px 48px">
        <!-- Status Section -->
        <div v-if="status === 'idle'" class="space-y-6">
          <button
            @click="requestMicrophoneAccess"
            class="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 10a2 2 0 100-4 2 2 0 000 4z" />
              <path
                fill-rule="evenodd"
                d="M10 2a6 6 0 00-6 6v3a1 1 0 11-2 0V8a8 8 0 1116 0v3a1 1 0 11-2 0v-3a6 6 0 00-6-6z"
                clip-rule="evenodd"
              />
            </svg>
            Enable Microphone
          </button>
          <p class="text-gray-500 text-center text-sm">
            Click the button above to start testing your microphone
          </p>
        </div>

        <!-- Requesting State -->
        <div v-else-if="status === 'requesting'" class="flex items-center justify-center py-12">
          <div class="flex flex-col items-center gap-4">
            <div class="relative w-12 h-12">
              <svg class="animate-spin w-12 h-12 text-blue-500" viewBox="0 0 50 50">
                <circle
                  class="opacity-25"
                  cx="25"
                  cy="25"
                  r="20"
                  stroke="currentColor"
                  stroke-width="5"
                  fill="none"
                />
                <circle
                  class="text-blue-500"
                  cx="25"
                  cy="25"
                  r="20"
                  stroke="currentColor"
                  stroke-width="5"
                  fill="none"
                  stroke-dasharray="100"
                  stroke-dashoffset="75"
                />
              </svg>
            </div>
            <p class="text-gray-600">Requesting microphone access...</p>
          </div>
        </div>

        <!-- Active State with Audio Levels -->
        <div v-else-if="status === 'active'" class="space-y-6">
          <div class="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
            <svg
              class="w-5 h-5 text-green-600 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clip-rule="evenodd"
              />
            </svg>
            <div>
              <p class="font-semibold text-green-900">Microphone Active</p>
              <p class="text-sm text-green-700" v-if="deviceName">{{ deviceName }}</p>
            </div>
          </div>

          <!-- Audio Level Visualization -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <label class="text-sm font-semibold text-gray-700">Audio Level</label>
              <span class="text-sm font-mono text-gray-600">{{ Math.round(audioLevel) }}</span>
            </div>
            <div class="flex items-center gap-1 bg-gray-100 p-2 rounded-lg">
              <div
                v-for="i in 40"
                :key="i"
                class="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-sm transition-all duration-75"
                :style="{
                  height: audioLevel > i * 2 ? `${Math.min(audioLevel / 5, 100)}px` : '4px',
                }"
              />
            </div>
          </div>

          <!-- Status Indicator -->
          <div class="text-center">
            <div
              class="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-sm font-medium"
            >
              <span class="flex w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
              Listening
            </div>
          </div>

          <!-- Stop Button -->
          <button
            @click="stopMicrophone"
            class="w-full bg-red-500 hover:bg-red-600 active:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Stop Microphone
          </button>
        </div>

        <!-- Error State -->
        <div v-else-if="status === 'error'" class="space-y-6">
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <div class="flex gap-3">
              <svg
                class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clip-rule="evenodd"
                />
              </svg>
              <div>
                <p class="font-semibold text-red-900">Microphone Error</p>
                <p class="text-sm text-red-700 mt-1">{{ errorMessage }}</p>
              </div>
            </div>
          </div>

          <button
            @click="requestMicrophoneAccess"
            class="w-full bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>

      <!-- Transcription Section -->
      <div v-if="status === 'active'" class="rounded-2xl bg-white shadow-lg p-8 sm:p-12 mt-6">
        <div class="mb-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">Live Transcription</h2>
            <button
              v-if="finalTranscript || interimTranscript"
              @click="clearTranscript"
              class="text-sm text-gray-600 hover:text-gray-900 font-medium"
            >
              Clear
            </button>
          </div>
          <p class="text-gray-600">What you say will appear here in real-time</p>
        </div>

        <!-- Transcription Error -->
        <div v-if="transcriptionError" class="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div class="flex gap-3">
            <svg
              class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fill-rule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clip-rule="evenodd"
              />
            </svg>
            <div>
              <p class="font-semibold text-red-900">Transcription Error</p>
              <p class="text-sm text-red-700 mt-1">{{ transcriptionError }}</p>
              <p class="text-xs text-red-600 mt-2">Check your browser console (F12) for details</p>
            </div>
          </div>
        </div>

        <!-- Transcription Status -->
        <div v-if="isTranscribing" class="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div class="flex items-center gap-2 text-sm text-blue-700">
            <span class="inline-flex w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
            <span>Speech recognition is listening...</span>
          </div>
        </div>

        <!-- Transcription Display -->
        <div class="space-y-4">
          <!-- Combined Transcript Box -->
          <div
            v-if="finalTranscript || interimTranscript"
            class="bg-blue-50 border-2 border-blue-200 rounded-lg p-4"
          >
            <p class="text-sm font-semibold text-blue-900 mb-2">Transcript:</p>
            <div class="text-gray-900 whitespace-pre-wrap" style="line-height: 30px" v-if="finalTranscript || interimTranscript">
              {{ finalTranscript }}<span v-if="interimTranscript" class="italic text-gray-600">{{ (finalTranscript ? '\n' : '') + (interimTranscript ? interimTranscript.charAt(0).toUpperCase() + interimTranscript.slice(1) : '') }}</span>
            </div>
          </div>

          <!-- Empty State -->
          <div
            v-if="!finalTranscript && !interimTranscript && isTranscribing"
            class="bg-gray-50 rounded-lg p-8 text-center"
          >
            <div class="flex justify-center mb-3">
              <svg
                class="w-8 h-8 text-gray-400 animate-pulse"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path d="M10 10a2 2 0 100-4 2 2 0 000 4z" />
                <path
                  fill-rule="evenodd"
                  d="M10 2a6 6 0 00-6 6v3a1 1 0 11-2 0V8a8 8 0 1116 0v3a1 1 0 11-2 0v-3a6 6 0 00-6-6z"
                  clip-rule="evenodd"
                />
              </svg>
            </div>
            <p class="text-gray-500">Waiting for speech input...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
