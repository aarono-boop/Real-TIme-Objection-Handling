<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

type MicStatus = 'idle' | 'requesting' | 'active' | 'error'

interface AudioDevice {
  deviceId: string
  label: string
}

const status = ref<MicStatus>('idle')
const errorMessage = ref('')
const audioLevel = ref(0)
const stream = ref<MediaStream | null>(null)
const analyser = ref<AnalyserNode | null>(null)
const animationFrameId = ref<number | null>(null)
const deviceName = ref('')
const audioDevices = ref<AudioDevice[]>([])
const selectedDeviceId = ref('')

const interimTranscript = ref('')
const finalTranscript = ref('')
const transcriptionError = ref('')
const isTranscribing = ref(false)
let recognition: (SpeechRecognition & any) | null = null

async function enumerateAudioDevices() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices()
    const audioInputs = devices.filter((device) => device.kind === 'audioinput')

    audioDevices.value = audioInputs.map((device) => ({
      deviceId: device.deviceId,
      label: device.label || `Microphone ${audioInputs.indexOf(device) + 1}`,
    }))

    if (audioDevices.value.length > 0 && !selectedDeviceId.value) {
      selectedDeviceId.value = audioDevices.value[0].deviceId
    }
  } catch (error) {
    console.error('Error enumerating audio devices:', error)
  }
}

async function requestMicrophoneAccess() {
  try {
    status.value = 'requesting'
    errorMessage.value = ''

    const constraints: MediaStreamAudioConstraints = {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false,
    }

    if (selectedDeviceId.value) {
      constraints.deviceId = { exact: selectedDeviceId.value }
    }

    const mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: constraints,
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
        errorMessage.value = 'No microphone device found. Please connect a microphone and try again.'
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
}

function initializeTranscription() {
  const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition

  if (!SpeechRecognition) {
    transcriptionError.value = 'Speech Recognition is not supported in your browser'
    return
  }

  recognition = new SpeechRecognition()
  recognition.continuous = true
  recognition.interimResults = true
  recognition.lang = 'en-US'
  recognition.maxAlternatives = 1

  recognition.onstart = () => {
    isTranscribing.value = true
    transcriptionError.value = ''
  }

  recognition.onresult = (event: Event) => {
    const speechEvent = event as any
    interimTranscript.value = ''

    for (let i = speechEvent.resultIndex; i < speechEvent.results.length; i++) {
      const transcript = speechEvent.results[i][0].transcript

      if (speechEvent.results[i].isFinal) {
        finalTranscript.value += transcript + ' '
      } else {
        interimTranscript.value += transcript
      }
    }
  }

  recognition.onerror = (event: Event) => {
    const errorEvent = event as any

    if (errorEvent.error === 'no-speech') {
      transcriptionError.value = ''
      if (status.value === 'active') {
        try {
          recognition.start()
        } catch (e) {
        }
      }
    } else {
      transcriptionError.value = `Transcription error: ${errorEvent.error}`
      isTranscribing.value = false
    }
  }

  recognition.onend = () => {
    if (status.value === 'active' && isTranscribing.value) {
      try {
        recognition.start()
      } catch (e) {
      }
    } else {
      isTranscribing.value = false
    }
  }

  recognition.start()
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

onMounted(() => {
  enumerateAudioDevices()
})

onBeforeUnmount(() => {
  stopMicrophone()
})
</script>

<template>
  <div class="w-full max-w-2xl mx-auto">
    <div class="rounded-2xl bg-white shadow-lg p-8 sm:p-12">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Microphone Checker</h1>
        <p class="text-gray-600 text-lg">Test your microphone and monitor audio input levels</p>
      </div>

      <!-- Status Section -->
      <div v-if="status === 'idle'" class="space-y-6">
        <!-- Device Selector -->
        <div v-if="audioDevices.length > 0" class="space-y-2">
          <label for="device-select" class="block text-sm font-semibold text-gray-700">
            Select Microphone
          </label>
          <select
            id="device-select"
            v-model="selectedDeviceId"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
          >
            <option v-for="device in audioDevices" :key="device.deviceId" :value="device.deviceId">
              {{ device.label }}
            </option>
          </select>
        </div>

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
          Select a microphone above and click the button to start testing
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
          <svg class="w-5 h-5 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
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
            <svg class="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
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
      <div v-if="transcriptionError" class="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div class="flex gap-3">
          <svg class="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path
              fill-rule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clip-rule="evenodd"
            />
          </svg>
          <p class="text-sm text-orange-700">{{ transcriptionError }}</p>
        </div>
      </div>

      <!-- Transcription Display -->
      <div class="space-y-4">
        <!-- Final Transcript -->
        <div v-if="finalTranscript" class="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <p class="text-sm font-semibold text-blue-900 mb-2">Final:</p>
          <p class="text-gray-900 leading-relaxed">{{ finalTranscript }}</p>
        </div>

        <!-- Interim Transcript -->
        <div v-if="interimTranscript" class="bg-gray-50 border border-gray-300 rounded-lg p-4">
          <p class="text-sm font-semibold text-gray-600 mb-2">Currently Speaking:</p>
          <p class="text-gray-700 italic leading-relaxed">{{ interimTranscript }}</p>
        </div>

        <!-- Empty State -->
        <div v-if="!finalTranscript && !interimTranscript && isTranscribing" class="bg-gray-50 rounded-lg p-8 text-center">
          <div class="flex justify-center mb-3">
            <svg class="w-8 h-8 text-gray-400 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
              <path
                d="M10 10a2 2 0 100-4 2 2 0 000 4z"
              />
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
</template>

<style scoped></style>
