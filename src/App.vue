<script setup lang="ts">
import { ref } from 'vue'
import MicrophoneChecker from './components/MicrophoneChecker.vue'
import ObjectionHandler from './components/ObjectionHandler.vue'
import type { Objection } from './data/objections'

const detectedObjections = ref<Objection[]>([])

function onObjectionDetected(objection: Objection) {
  if (!detectedObjections.value.find((o) => o.id === objection.id)) {
    detectedObjections.value.push(objection)
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
        <MicrophoneChecker @objection-detected="onObjectionDetected" />
      </div>

      <!-- Right column: Objection Handler -->
      <div>
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
