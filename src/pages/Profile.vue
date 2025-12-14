<template>
  <div class="profile-page">
    <header class="page-header">
      <button @click="router.push('/dashboard')" class="back-btn">
        ← Back to Dashboard
      </button>
      <button @click="handleLogout" class="logout-btn-header">
        Access Control: Logout
      </button>
    </header>

    <div class="profile-header" v-if="userStore.user">
      <div class="avatar-circle">
        {{ userStore.user.email?.charAt(0).toUpperCase() || 'U' }}
      </div>
      <div class="user-details">
        <h1 class="user-email">{{ userStore.user.email }}</h1>
        <p class="user-id">User ID: {{ userStore.user.uid.slice(0, 8) }}...</p>
      </div>
    </div>

    <!-- Stats Section -->
    <div class="stats-grid">
      <div class="stat-card">
        <h3>{{ myItems.length }}</h3>
        <p>Items Reported</p>
      </div>
      <div class="stat-card">
        <h3>{{ myClaimsCount }}</h3>
        <p>Items Claimed</p>
      </div>
    </div>

    <!-- Tabs -->
    <div class="profile-tabs">
      <button 
        :class="['tab', { active: activeTab === 'reports' }]"
        @click="activeTab = 'reports'"
      >
        My Reports
      </button>
      <!-- Future: Add 'My Claims' tab -->
    </div>

    <!-- Content -->
    <div class="tab-content">
      <div v-if="isLoading" class="loading-state">Loading your items...</div>
      
      <div v-else-if="myItems.length > 0" class="items-grid">
        <div v-for="item in myItems" :key="item.id" class="item-card-mini">
          <div class="item-info">
            <span :class="['type-badge', item.type.toLowerCase()]">{{ item.type }}</span>
            <h4>{{ item.title }}</h4>
            <p class="date">{{ formatDate(item.date) }}</p>
            <span :class="['status-badge', item.status.toLowerCase()]">{{ item.status }}</span>
          </div>
          <div class="item-actions">
            <!-- Simple Edit/Delete actions for simplified view -->
            <button @click="handleDelete(item.id)" class="btn-text delete">Delete</button>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <p>You haven't reported any items yet.</p>
        <button @click="router.push('/post')" class="action-link">Report an Item</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/userStore'
import { fetchItems, deleteItem } from '@/services/itemService'
import { auth } from '@/firebase'
import { signOut } from 'firebase/auth'

const router = useRouter()
const userStore = useUserStore()

const activeTab = ref('reports')
const myItems = ref([])
const isLoading = ref(true)

// TODO: fetch 'My Claims' count effectively. For now hardcode or separate API.
const myClaimsCount = ref(0) 

onMounted(async () => {
  if (!userStore.user) return
  await loadMyItems()
})

async function loadMyItems() {
  isLoading.value = true
  try {
    // Fetch all my items (Status: null means all statuses, excludeResolved: false to show everything including history)
    const data = await fetchItems({
      userId: userStore.user.uid,
      excludeResolved: false,
      size: 100 // Get a good chunk of history
    })
    myItems.value = data.content || []
  } catch (error) {
    console.error('Failed to load profile items:', error)
  } finally {
    isLoading.value = false
  }
}

async function handleLogout() {
  try {
    await signOut(auth)
    router.push('/login')
  } catch (error) {
    console.error('Logout error:', error)
  }
}

async function handleDelete(id) {
  if (!confirm('Are you sure you want to delete this item?')) return
  try {
    await deleteItem(id)
    myItems.value = myItems.value.filter(i => i.id !== id)
  } catch (error) {
    console.error('Delete error:', error)
  }
}

function formatDate(date) {
  return new Date(date).toLocaleDateString()
}
</script>

<style scoped>
.profile-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  min-height: 100vh;
  background-color: var(--bg-primary);
}

.page-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 2rem;
}

.back-btn {
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  color: var(--text-secondary);
}

.logout-btn-header {
  background: none;
  border: 1px solid var(--error);
  color: var(--error);
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  margin-bottom: 2rem;
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.avatar-circle {
  width: 80px;
  height: 80px;
  background: var(--primary-gradient);
  color: white;
  font-size: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: bold;
}

.user-email {
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-primary);
}

.user-id {
  color: var(--text-secondary);
  font-size: 0.9rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: white;
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.stat-card h3 {
  font-size: 2rem;
  margin: 0;
  color: var(--primary-color);
}

.stat-card p {
  margin: 0.5rem 0 0;
  color: var(--text-secondary);
}

.profile-tabs {
  display: flex;
  gap: 1rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 2rem;
}

.tab {
  padding: 1rem;
  background: none;
  border: none;
  font-size: 1rem;
  cursor: pointer;
  color: var(--text-secondary);
  border-bottom: 2px solid transparent;
}

.tab.active {
  color: var(--primary-color);
  border-bottom-color: var(--primary-color);
  font-weight: 600;
}

.items-grid {
  display: grid;
  gap: 1rem;
}

.item-card-mini {
  background: white;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.item-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.type-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: bold;
}

.type-badge.lost {
  background: #fee2e2;
  color: #dc2626;
}

.type-badge.found {
  background: #dcfce7;
  color: #16a34a;
}

.item-card-mini h4 {
  margin: 0;
  font-size: 1rem;
}

.date {
  color: var(--text-secondary);
  font-size: 0.85rem;
  margin: 0;
}

.status-badge {
  font-size: 0.75rem;
  padding: 0.2rem 0.5rem;
  background: #f3f4f6;
  border-radius: 12px;
}

.btn-text.delete {
  background: none;
  border: none;
  color: var(--error);
  cursor: pointer;
}
</style>
