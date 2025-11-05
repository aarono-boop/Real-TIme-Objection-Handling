<script setup lang="ts">
import type { Objection } from '../data/objections'

interface Props {
  detectedObjections: Objection[]
}

withDefaults(defineProps<Props>(), {
  detectedObjections: () => [],
})

const emit = defineEmits<{
  clear: []
}>()
</script>

<template>
  <div class="rounded-2xl bg-white shadow-lg h-full flex flex-col" style="padding: 32px 48px 48px">
    <div class="flex items-center justify-between" style="padding-bottom: 20px">
      <div>
        <h2 class="text-2xl sm:text-3xl font-bold text-gray-900">Objection Handling</h2>
        <p class="text-gray-600 mt-1 text-sm">Detected objections and suggested responses</p>
      </div>
      <button
        v-if="detectedObjections.length > 0"
        @click="emit('clear')"
        class="text-sm text-gray-600 hover:text-gray-900 font-medium whitespace-nowrap ml-2"
      >
        Clear All
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="detectedObjections.length === 0" class="flex-1 flex items-center justify-center" style="padding-top: 21px">
      <div class="text-center">
        <svg
          class="w-16 h-16 text-gray-300 mx-auto mb-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="2"
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <p class="text-gray-500">No objections detected yet</p>
      </div>
    </div>

    <!-- Detected Objections List -->
    <div v-else class="space-y-4 overflow-y-auto flex-1">
      <div
        v-for="objection in detectedObjections"
        :key="objection.id"
        class="bg-amber-50 border border-amber-200 rounded-lg p-4"
      >
        <!-- Objection Statement -->
        <div class="mb-3">
          <p class="text-sm font-semibold text-amber-900 mb-1">Objection Detected:</p>
          <p class="text-amber-800 italic">{{ objection.objection }}</p>
        </div>

        <!-- Suggested Response -->
        <div class="mb-3">
          <p class="text-sm font-semibold text-green-900 mb-1">Suggested Response:</p>
          <p class="text-gray-700 text-sm leading-relaxed">{{ objection.response }}</p>
        </div>

        <!-- Pro Tip -->
        <div class="bg-blue-50 border border-blue-200 rounded p-3">
          <p class="text-xs font-semibold text-blue-900 mb-1">💡 Pro Tip:</p>
          <p class="text-xs text-blue-800">{{ objection.proTip }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped></style>
