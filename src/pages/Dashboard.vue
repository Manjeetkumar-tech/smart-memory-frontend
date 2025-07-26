<template>
  <div class="p-6 space-y-4">
    <AuthForm v-if="!userStore.user" />
    <div v-if="userStore.user">
      Logged in as: <strong>{{ userStore.user.email }}</strong>
      <button @click="logout" class="ml-4 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600">
        Logout
      </button>
    </div>
    <h1 class="text-2xl font-bold">📘 Your Memory Logs</h1>

    <!-- Input Form -->
    <InputForm @submit-log="addLog" />

    <!-- Logs List -->
    <div v-if="logs.length" class="space-y-2">
      <div v-for="(log, index) in logs" :key="index" class="p-3 rounded border bg-white">
        <div v-if="editId === log.id">
          <textarea
            v-model="editContent"
            class="w-full border px-2 py-1 rounded resize-none"
          ></textarea>
          <input v-model="editMood" placeholder="Mood" class="mt-2 w-full p-1 border rounded" />
          <input
            v-model="editCategory"
            placeholder="Category"
            class="mt-2 w-full p-1 border rounded"
          />
          <div class="mt-2 space-x-2">
            <button @click="saveEdit(log.id)" class="px-2 py-1 bg-green-500 text-white rounded">
              Save
            </button>
            <button @click="editId = null" class="px-2 py-1 bg-gray-400 text-white rounded">
              Cancel
            </button>
          </div>
        </div>
        <div v-else>
          <p class="whitespace-pre-wrap">{{ log.text }}</p>
          <div class="text-sm text-gray-500 mt-1">
            <span><strong>Mood:</strong> {{ log.mood || 'N/A' }}</span>
            <span class="ml-4"><strong>Category:</strong> {{ log.category || 'N/A' }}</span>
          </div>
          <div class="text-sm text-gray-500">{{ new Date(log.timestamp).toLocaleString() }}</div>
          <div class="mt-2 space-x-2">
            <button @click="startEdit(log)" class="px-2 py-1 bg-blue-500 text-white rounded">
              Edit
            </button>
            <button @click="handleDelete(log.id)" class="px-2 py-1 bg-red-500 text-white rounded">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
    <p v-else class="text-gray-500">No logs yet. Start by adding one above ⬆️</p>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import InputForm from '@/components/InputForm.vue'
import AuthForm from '@/components/AuthForm.vue'
import { fetchLogs, createLog, deleteLog, updateLog } from '@/services/logService'
import { useUserStore } from '@/stores/userStore'
import { auth } from '@/firebase'
import { signOut } from 'firebase/auth'

const logs = ref([])
const userStore = useUserStore()
const editId = ref(null)
const editContent = ref('')
const editMood = ref('')
const editCategory = ref('')
const user = computed(() => userStore.user)

watch(
  () => userStore.user,
  async (newUser) => {
    if (newUser) {
      logs.value = (await fetchLogs(newUser.uid))
        .map((log) => ({
          id: log.id,
          userId: log.userId,
          text: log.content,
          timestamp: log.timestamp,
          mood: log.mood || '',
          category: log.category || '',
        }))
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    } else {
      logs.value = []
    }
  },
  { immediate: true },
)

async function handleDelete(id) {
  await deleteLog(id)
  logs.value = logs.value.filter((log) => log.id !== id)
}

function startEdit(log) {
  editId.value = log.id
  editContent.value = log.text
  editMood.value = log.mood
  editCategory.value = log.category
}

async function saveEdit(id) {
  const log = logs.value.find((l) => l.id === id)
  if (!log) {
    alert('Log not found')
    return
  }

  const updated = await updateLog(
    id,
    editContent.value,
    log.userId,
    log.timestamp,
    editMood.value,
    editCategory.value,
  )

  const index = logs.value.findIndex((l) => l.id === id)
  if (index !== -1) {
    logs.value[index].text = updated.content
    logs.value[index].mood = updated.mood
    logs.value[index].category = updated.category
  }
  editId.value = null
}

async function addLog(logData) {
  if (!userStore.user) {
    alert('Please login to add logs.')
    return
  }
  const newLog = await createLog(
    logData.content,
    userStore.user.uid,
    logData.mood,
    logData.category,
  )
  logs.value.unshift({
    id: newLog.id,
    userId: newLog.userId,
    text: newLog.content,
    timestamp: newLog.timestamp,
    mood: newLog.mood || '',
    category: newLog.category || '',
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
