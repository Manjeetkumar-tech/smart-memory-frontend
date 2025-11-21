<template>
  <div class="dashboard-container">
    <AuthForm v-if="!userStore.user" />
    <div v-if="userStore.user" class="user-info">
      <span class="user-email">Logged in as: <strong>{{ userStore.user.email }}</strong></span>
      <button @click="logout" class="logout-btn">
        Logout
      </button>
    </div>
    <h1 class="dashboard-title">📘 Your Memory Logs</h1>

    <!-- Input Form -->
    <InputForm @submit-log="addLog" />

    <!-- Logs List -->
    <div v-if="logs.length" class="logs-container">
      <div v-for="(log, index) in logs" :key="index" class="log-card">
        <div v-if="editId === log.id" class="edit-mode">
          <textarea
            v-model="editContent"
            class="edit-textarea"
          ></textarea>
          <input v-model="editMood" placeholder="Mood" class="edit-input" />
          <input
            v-model="editCategory"
            placeholder="Category"
            class="edit-input"
          />
          <div class="edit-actions">
            <button @click="saveEdit(log.id)" class="btn btn-save">
              Save
            </button>
            <button @click="editId = null" class="btn btn-cancel">
              Cancel
            </button>
          </div>
        </div>
        <div v-else class="view-mode">
          <p class="log-text">{{ log.text }}</p>
          <div class="log-meta">
            <span class="meta-item"><strong>Mood:</strong> {{ log.mood || 'N/A' }}</span>
            <span class="meta-item"><strong>Category:</strong> {{ log.category || 'N/A' }}</span>
          </div>
          <div class="log-timestamp">{{ new Date(log.timestamp).toLocaleString() }}</div>
          <div class="log-actions">
            <button @click="startEdit(log)" class="btn btn-edit">
              Edit
            </button>
            <button @click="handleDelete(log.id)" class="btn btn-delete">
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
    <p v-else class="empty-state">No logs yet. Start by adding one above ⬆️</p>
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

<style scoped>
.dashboard-container {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

.user-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 1.5rem;
  background: var(--gradient-card);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  margin-bottom: 1.5rem;
  border: 1px solid var(--color-border);
}

.user-email {
  color: var(--color-text);
  font-size: 0.95rem;
}

.logout-btn {
  padding: 0.5rem 1.25rem;
  background: var(--error);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
}

.logout-btn:hover {
  background: hsl(0, 84%, 50%);
  box-shadow: var(--shadow-md);
  transform: translateY(-1px);
}

.dashboard-title {
  font-size: 2rem;
  font-weight: 700;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 1.5rem;
  text-align: center;
}

.logs-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-top: 2rem;
}

.log-card {
  background: var(--gradient-card);
  backdrop-filter: blur(10px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base);
}

.log-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
  border-color: var(--primary-200);
}

.view-mode {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.log-text {
  color: var(--color-heading);
  font-size: 1rem;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.log-meta {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.meta-item {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.meta-item strong {
  color: var(--color-text);
  font-weight: 600;
}

.log-timestamp {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.log-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.edit-mode {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.edit-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
  font-size: 0.95rem;
  transition: all var(--transition-base);
  background: white;
}

.edit-textarea:focus {
  outline: none;
  border-color: var(--primary-400);
  box-shadow: 0 0 0 3px var(--primary-100);
}

.edit-input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 0.95rem;
  transition: all var(--transition-base);
  background: white;
}

.edit-input:focus {
  outline: none;
  border-color: var(--primary-400);
  box-shadow: 0 0 0 3px var(--primary-100);
}

.edit-actions {
  display: flex;
  gap: 0.75rem;
}

.btn {
  padding: 0.625rem 1.25rem;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-sm);
}

.btn:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn:active {
  transform: translateY(0);
}

.btn-edit {
  background: var(--primary-500);
  color: white;
}

.btn-edit:hover {
  background: var(--primary-600);
}

.btn-delete {
  background: var(--error);
  color: white;
}

.btn-delete:hover {
  background: hsl(0, 84%, 50%);
}

.btn-save {
  background: var(--success);
  color: white;
}

.btn-save:hover {
  background: hsl(142, 76%, 40%);
}

.btn-cancel {
  background: var(--neutral-400);
  color: white;
}

.btn-cancel:hover {
  background: var(--neutral-500);
}

.empty-state {
  text-align: center;
  color: var(--color-text-muted);
  font-size: 1.1rem;
  margin-top: 3rem;
  padding: 2rem;
  background: var(--gradient-card);
  border-radius: var(--radius-lg);
  border: 2px dashed var(--color-border);
}

@media (max-width: 640px) {
  .dashboard-container {
    padding: 1rem 0.5rem;
  }

  .user-info {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }

  .dashboard-title {
    font-size: 1.5rem;
  }

  .log-meta {
    flex-direction: column;
    gap: 0.5rem;
  }

  .log-actions,
  .edit-actions {
    flex-direction: column;
  }

  .btn {
    width: 100%;
  }
}
</style>
