<template>
  <div class="dashboard-container">
    <div class="user-info">
      <span class="user-email">Logged in as: <strong>{{ userStore.user?.email }}</strong></span>
      <button @click="logout" class="logout-btn">
        Logout
      </button>
    </div>
    <h1 class="dashboard-title">🔍 Lost & Found Dashboard</h1>

    <!-- Input Form -->
    <InputForm @submit-item="addItem" />

    <!-- Filter Tabs -->
    <div class="filter-tabs">
      <button 
        @click="filterType = null" 
        :class="['tab', { active: filterType === null }]"
      >
        All Items
      </button>
      <button 
        @click="filterType = 'LOST'" 
        :class="['tab', { active: filterType === 'LOST' }]"
      >
        Lost Items
      </button>
      <button 
        @click="filterType = 'FOUND'" 
        :class="['tab', { active: filterType === 'FOUND' }]"
      >
        Found Items
      </button>
    </div>

    <!-- Items List -->
    <div v-if="filteredItems.length" class="items-container">
      <div v-for="item in filteredItems" :key="item.id" class="item-card">
        <div class="item-header">
          <span :class="['item-badge', item.type.toLowerCase()]">
            {{ item.type === 'LOST' ? '🔴 LOST' : '🟢 FOUND' }}
          </span>
          <span :class="['status-badge', item.status.toLowerCase()]">
            {{ item.status }}
          </span>
        </div>
        <h3 class="item-title">{{ item.title }}</h3>
        <p class="item-description">{{ item.description }}</p>
        <div class="item-details">
          <div class="detail-item">
            <strong>📍 Location:</strong> {{ item.location }}
          </div>
          <div class="detail-item">
            <strong>📅 Date:</strong> {{ formatDate(item.date) }}
          </div>
          <div class="detail-item">
            <strong>📞 Contact:</strong> {{ item.contactInfo }}
          </div>
        </div>
        <div class="item-actions">
          <button @click="handleDelete(item.id)" class="btn btn-delete">
            Delete
          </button>
        </div>
      </div>
    </div>
    <p v-else class="empty-state">No items yet. Start by reporting one above ⬆️</p>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import InputForm from '@/components/InputForm.vue'
import { fetchItems, createItem, deleteItem } from '@/services/itemService'
import { useUserStore } from '@/stores/userStore'
import { auth } from '@/firebase'
import { signOut } from 'firebase/auth'

const router = useRouter()

const items = ref([])
const filterType = ref(null)
const userStore = useUserStore()

const filteredItems = computed(() => {
  if (!filterType.value) return items.value
  return items.value.filter(item => item.type === filterType.value)
})

// Redirect to login if not authenticated
onMounted(() => {
  if (!userStore.user) {
    router.push('/login')
  }
})

watch(
  () => userStore.user,
  async (newUser) => {
    if (newUser) {
      await loadItems()
    } else {
      items.value = []
      router.push('/login')
    }
  },
  { immediate: true },
)

async function loadItems() {
  try {
    const data = await fetchItems()
    items.value = data.sort((a, b) => new Date(b.date) - new Date(a.date))
  } catch (error) {
    console.error('Error loading items:', error)
  }
}

async function handleDelete(id) {
  if (!confirm('Are you sure you want to delete this item?')) return
  
  try {
    await deleteItem(id)
    items.value = items.value.filter((item) => item.id !== id)
  } catch (error) {
    console.error('Error deleting item:', error)
    alert('Failed to delete item')
  }
}

async function addItem(itemData) {
  if (!userStore.user) {
    alert('Please login to add items.')
    return
  }
  
  try {
    const newItem = await createItem(itemData)
    items.value.unshift(newItem)
  } catch (error) {
    console.error('Error creating item:', error)
    alert('Failed to create item')
  }
}

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString()
}

function logout() {
  signOut(auth)
    .then(() => {
      userStore.clearUser()
      router.push('/login')
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

.filter-tabs {
  display: flex;
  gap: 1rem;
  margin: 2rem 0;
  justify-content: center;
}

.tab {
  padding: 0.75rem 1.5rem;
  background: white;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-base);
  color: var(--color-text);
}

.tab:hover {
  border-color: var(--primary-400);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.tab.active {
  background: var(--gradient-primary);
  color: white;
  border-color: transparent;
  box-shadow: var(--shadow-md);
}

.items-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-top: 2rem;
}

.item-card {
  background: var(--gradient-card);
  backdrop-filter: blur(10px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.item-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-4px);
  border-color: var(--primary-200);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.item-badge {
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-md);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.item-badge.lost {
  background: hsl(0, 84%, 95%);
  color: var(--error);
}

.item-badge.found {
  background: hsl(142, 76%, 95%);
  color: var(--success);
}

.status-badge {
  padding: 0.375rem 0.75rem;
  border-radius: var(--radius-md);
  font-size: 0.7rem;
  font-weight: 600;
  background: var(--neutral-100);
  color: var(--neutral-600);
}

.status-badge.open {
  background: hsl(200, 80%, 95%);
  color: hsl(200, 80%, 40%);
}

.item-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-heading);
  margin: 0;
}

.item-description {
  color: var(--color-text);
  line-height: 1.6;
  margin: 0;
}

.item-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border);
}

.detail-item {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.detail-item strong {
  color: var(--color-text);
  font-weight: 600;
}

.item-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
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

.btn-delete {
  background: var(--error);
  color: white;
}

.btn-delete:hover {
  background: hsl(0, 84%, 50%);
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

  .filter-tabs {
    flex-direction: column;
  }

  .items-container {
    grid-template-columns: 1fr;
  }
}
</style>
