<script setup lang="ts">
import MicrophoneChecker from './components/MicrophoneChecker.vue'
import ObjectionHandler from './components/ObjectionHandler.vue'
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 py-8 px-4 sm:py-12 sm:px-6">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
      <!-- Left column: Microphone Checker (2 cols on large screens) -->
      <div class="lg:col-span-2">
        <MicrophoneChecker />
      </div>

      <!-- Right column: Objection Handler -->
      <div class="lg:col-span-1">
        <ObjectionHandler />
      </div>
    </div>
  </div>
</template>

<style scoped></style>
