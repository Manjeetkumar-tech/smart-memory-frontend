<template>
  <form @submit.prevent="submitLog" class="p-4 border rounded bg-white shadow-md">
    <textarea
      v-model="logText"
      placeholder="What did you do today?"
      rows="4"
      class="w-full p-2 border rounded resize-none"
    ></textarea>
    <input
      v-model="mood"
      type="text"
      placeholder="Mood (e.g. happy, sad)"
      class="mt-2 w-full p-2 border rounded"
    />
    <input
      v-model="category"
      type="text"
      placeholder="Category (e.g. work, personal)"
      class="mt-2 w-full p-2 border rounded"
    />
    <button type="submit" class="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
      Save Log
    </button>
  </form>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['submit-log'])
const logText = ref('')
const mood = ref('')
const category = ref('')

function submitLog() {
  if (!logText.value.trim()) return
  emit('submit-log', {
    content: logText.value,
    mood: mood.value,
    category: category.value,
  })
  logText.value = ''
  mood.value = ''
  category.value = ''
}
</script>
