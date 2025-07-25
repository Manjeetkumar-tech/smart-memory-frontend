<template>
  <div class="p-4 border-b bg-gray-50">
    <p class="text-gray-800 whitespace-pre-line">{{ entry.content || entry.text }}</p>
    <small class="text-gray-500">{{ entry.timestamp }}</small>
  </div>
</template>

<script setup>
defineProps({
  entry: {
    type: Object,
    required: true,
  },
})
</script>
