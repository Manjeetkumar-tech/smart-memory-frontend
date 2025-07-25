<template>
  <div class="p-6 space-y-4">
    <AuthForm v-if="!userStore.user" />
    <div v-if="userStore.user">
      Logged in as: <strong>{{ userStore.user.email }}</strong>
      <!-- Add logged-in user info -->
      <button @click="logout" class="ml-4 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">
        Logout
      </button>
    </div>
    <h1 class="text-2xl font-bold">📘 Your Memory Logs</h1>

    <!-- Input Form -->
    <InputForm @submit-log="addLog" />

    <!-- Logs List -->
    <div v-if="logs.length" class="space-y-2">
      <LogEntry v-for="(log, index) in logs" :key="index" :entry="log" />
    </div>
    <p v-else class="text-gray-500">No logs yet. Start by adding one above ⬆️</p>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import InputForm from '@/components/InputForm.vue'
import LogEntry from '@/components/LogEntry.vue'
import AuthForm from '@/components/AuthForm.vue'
import { fetchLogs, createLog } from '@/services/logService'
import { useUserStore } from '@/stores/userStore'
import { auth } from '@/firebase'
import { signOut } from 'firebase/auth'

const logs = ref([])
const userStore = useUserStore()
const user = computed(() => userStore.user)

// Fetch logs from backend on page load
onMounted(async () => {
  logs.value = (await fetchLogs()).map((log) => ({
    userId: log.userId,
    text: log.content,
    timestamp: new Date(log.timestamp).toLocaleString(),
  }))
})

async function addLog(logText) {
  if (!userStore.user) {
    alert('Please login to add logs.')
    return
  }
  const newLog = await createLog(logText, userStore.user.uid)
  logs.value.unshift({
    userId: newLog.userId,
    text: newLog.content,
    timestamp: new Date(newLog.timestamp).toLocaleString(),
  })
}

function logout() {
  signOut(auth)
    .then(() => {
      userStore.clearUser()
      alert('Logged out successfully.')
    })
    .catch((error) => {
      alert('Error logging out: ' + error.message)
    })
}
</script>
