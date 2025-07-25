<template>
  <form @submit.prevent="submitLog" class="p-4 border rounded bg-white shadow-md">
    <textarea
      v-model="logText"
      placeholder="What did you do today?"
      rows="4"
      class="w-full p-2 border rounded resize-none"
    ></textarea>
    <button type="submit" class="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
      Save Log
    </button>
  </form>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['submit-log'])
const logText = ref('')

function submitLog() {
  if (!logText.value.trim()) return
  emit('submit-log', logText.value)
  logText.value = ''
}
</script>
