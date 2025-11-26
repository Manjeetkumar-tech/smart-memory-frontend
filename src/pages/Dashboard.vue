<template>
  <div class="dashboard-container">
    <div class="user-info">
      <span class="user-email">Logged in as: <strong>{{ userStore.user?.email }}</strong></span>
      <button @click="logout" class="logout-btn">
        Logout
      </button>
    </div>
    <div class="dashboard-header">
      <h1 class="dashboard-title">🔍 Lost & Found Dashboard</h1>
      
      <button 
        v-if="userStore.user" 
        @click="isInboxOpen = true" 
        class="inbox-btn"
      >
        📬 Inbox
        <span v-if="unreadCount > 0" class="global-unread-badge">
          {{ unreadCount }}
        </span>
      </button>
    </div>

    <!-- Input Form -->
    <InputForm 
      @submit-item="addItem" 
      :editing-item="editingItem"
      @clear-edit="editingItem = null"
    />

    <!-- My Items Toggle -->
    <div class="my-items-toggle">
      <label class="toggle-label">
        <input type="checkbox" v-model="showMyItemsOnly" class="toggle-checkbox" />
        <span class="toggle-text">Show My Items Only</span>
      </label>
    </div>

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
        
        <!-- Map display if coordinates available -->
        <div v-if="item.latitude && item.longitude" class="item-map">
          <MapDisplay 
            :latitude="item.latitude" 
            :longitude="item.longitude"
            :marker-title="item.title"
            height="150px"
          />
        </div>
        
        <!-- Image Gallery -->
        <div v-if="item.imageUrls && item.imageUrls.length" class="item-images">
          <div class="image-grid">
            <img 
              v-for="(url, idx) in item.imageUrls" 
              :key="idx"
              :src="url" 
              :alt="`${item.title} ${idx + 1}`"
              class="item-image"
              @click="openImageModal(url)"
            />
          </div>
        </div>
        
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
          <button 
            v-if="!isMyItem(item) && !item.claimedBy && item.type === 'FOUND'" 
            @click="handleClaim(item.id)" 
            class="btn btn-claim"
          >
            Claim Item
          </button>
          <span v-if="item.claimedBy" class="claimed-badge">
            {{ item.claimedBy === userStore.user?.uid ? '✓ Claimed by you' : '✓ Claimed' }}
          </span>
          <button 
            v-if="!isMyItem(item) && item.userId" 
            @click="openMessageModal(item)" 
            class="btn btn-message"
          >
            💬 Message
          </button>
          <button 
            v-if="isMyItem(item)" 
            @click="handleEdit(item)" 
            class="btn btn-edit"
          >
            ✏️ Edit
          </button>
          <button 
            v-if="isMyItem(item)"
            @click="handleDelete(item.id)" 
            class="btn btn-delete"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
    <p v-else class="empty-state">No items yet. Start by reporting one above ⬆️</p>
  </div>

  <!-- Image Modal -->
  <div v-if="selectedImage" class="image-modal" @click="selectedImage = null">
    <div class="modal-content" @click.stop>
      <button class="modal-close" @click="selectedImage = null">✕</button>
      <img :src="selectedImage" alt="Full size image" class="modal-image" />
    </div>
  </div>

  <!-- Messaging Modal -->
  <MessagingModal
    :is-open="isMessagingOpen"
    :item="selectedItem"
    :current-user-id="userStore.user?.uid"
    @close="isMessagingOpen = false"
  />

  <!-- Inbox Drawer -->
  <InboxDrawer
    :is-open="isInboxOpen"
    :current-user-id="userStore.user?.uid"
    @close="isInboxOpen = false"
    @open-chat="openMessageModal"
  />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import InputForm from '@/components/InputForm.vue'
import MapDisplay from '@/components/MapDisplay.vue'
import MessagingModal from '@/components/MessagingModal.vue'
import InboxDrawer from '@/components/InboxDrawer.vue'
import { fetchItems, createItem, deleteItem, claimItem } from '@/services/itemService'
import { getUnreadMessages } from '@/services/messageService'
import { useUserStore } from '@/stores/userStore'
import { auth } from '@/firebase'
import { signOut } from 'firebase/auth'

const router = useRouter()

const items = ref([])
const filterType = ref(null)
const showMyItemsOnly = ref(false)
const selectedImage = ref(null)
const editingItem = ref(null)
const isMessagingOpen = ref(false)
const isInboxOpen = ref(false)
const selectedItem = ref(null)
const unreadCount = ref(0)
const userStore = useUserStore()
let unreadPolling = null

onMounted(() => {
  loadItems()
  startUnreadPolling()
})

onUnmounted(() => {
  if (unreadPolling) clearInterval(unreadPolling)
})

function startUnreadPolling() {
  updateUnreadCount()
  unreadPolling = setInterval(updateUnreadCount, 10000) // Check every 10s
}

async function updateUnreadCount() {
  if (userStore.user?.uid) {
    try {
      const messages = await getUnreadMessages(userStore.user.uid)
      unreadCount.value = messages.length
    } catch (e) {
      console.error('Error checking unread:', e)
    }
  }
}

function openImageModal(url) {
  selectedImage.value = url
}

function openMessageModal(item) {
  selectedItem.value = item
  isMessagingOpen.value = true
}

const filteredItems = computed(() => {
  let filtered = items.value
  
  // Filter by type if selected
  if (filterType.value) {
    filtered = filtered.filter(item => item.type === filterType.value)
  }
  
  // Filter by user if toggle is on
  if (showMyItemsOnly.value && userStore.user) {
    filtered = filtered.filter(item => item.userId === userStore.user.uid)
  }
  
  return filtered
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

async function handleClaim(itemId) {
  if (!userStore.user) {
    alert('Please login to claim items.')
    return
  }
  
  // Fraud prevention: Ask verification question
  const verification = prompt('To verify this is your item, please provide a brief description or unique detail about it:')
  
  if (!verification || verification.trim().length < 5) {
    alert('Please provide a detailed verification (at least 5 characters)')
    return
  }
  
  if (!confirm('After claiming, the item owner will be notified. Confirm claim?')) {
    return
  }
  
  try {
    const updated = await claimItem(itemId, userStore.user.uid)
    const index = items.value.findIndex((item) => item.id === itemId)
    if (index !== -1) {
      items.value[index] = updated
    }
    alert('Item claimed! The finder has been notified.')
  } catch (error) {
    console.error('Error claiming item:', error)
    alert('Failed to claim item. Please try again.')
  }
}

function isMyItem(item) {
  return item.userId === userStore.user?.uid
}

function handleEdit(item) {
  // Scroll to top to show form
  window.scrollTo({ top: 0, behavior: 'smooth' })
  
  // Emit edit event to InputForm
  // We'll need to add a ref to InputForm and call a method on it
  editingItem.value = item
}

async function addItem(itemData) {
  if (!userStore.user) {
    alert('Please login to add items.')
    return
  }
  
  try {
    if (editingItem.value) {
      // Update existing item
      const response = await fetch(`http://localhost:8080/api/items/${editingItem.value.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...itemData,
          userId: userStore.user.uid
        })
      })
      const updatedItem = await response.json()
      const index = items.value.findIndex(item => item.id === editingItem.value.id)
      if (index !== -1) {
        items.value[index] = updatedItem
      }
      editingItem.value = null
    } else {
      // Create new item
      const newItem = await createItem({
        ...itemData,
        userId: userStore.user.uid
      })
      items.value.unshift(newItem)
    }
  } catch (error) {
    console.error('Error saving item:', error)
    alert('Failed to save item')
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

.my-items-toggle {
  display: flex;
  justify-content: center;
  margin: 1.5rem 0;
}

.toggle-label {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  cursor: pointer;
  padding: 0.75rem 1.25rem;
  background: white;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: all var(--transition-base);
}

.toggle-label:hover {
  border-color: var(--primary-400);
  box-shadow: var(--shadow-sm);
}

.toggle-checkbox {
  width: 18px;
  height: 18px;
  cursor: pointer;
}

.toggle-text {
  font-weight: 500;
  color: var(--color-heading);
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

.item-map {
  margin-top: 1rem;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.item-images {
  margin-top: 1rem;
}

.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.5rem;
}

.item-image {
  width: 100%;
  aspect-ratio: 1;
  object-fit: cover;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: transform var(--transition-base);
  border: 1px solid var(--color-border);
}

.item-image:hover {
  transform: scale(1.05);
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

.btn-claim {
  background: var(--success);
  color: white;
}

.btn-claim:hover {
  background: hsl(142, 76%, 40%);
}

.btn-edit {
  background: var(--primary-500);
  color: white;
}

.btn-edit:hover {
  background: var(--primary-600);
}

.btn-message {
  background: hsl(200, 100%, 50%);
  color: white;
}

.btn-message:hover {
  background: hsl(200, 100%, 45%);
}

.claimed-badge {
  padding: 0.625rem 1.25rem;
  background: hsl(142, 76%, 95%);
  color: hsl(142, 76%, 36%);
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.inbox-btn {
  position: relative;
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  cursor: pointer;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.inbox-btn:hover {
  background: #f5f5f5;
  border-color: var(--primary-400);
}

.global-unread-badge {
  background: var(--error);
  color: white;
  font-size: 0.75rem;
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
  min-width: 18px;
  text-align: center;
}

.empty-state {
  text-align: center;
  color: var(--color-text-muted);
  font-size: 1.1rem;
  padding: 3rem;
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
