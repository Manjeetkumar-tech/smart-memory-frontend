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

    <!-- Search Bar -->
    <div class="search-container">
      <div class="search-wrapper">
        <span class="search-icon">🔍</span>
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search items by title or description..."
          class="search-input"
        />
        <button
          v-if="searchQuery"
          @click="searchQuery = ''"
          class="search-clear"
          title="Clear search"
        >
          ✕
        </button>
      </div>
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

    <!-- Category Filter -->
    <div class="category-filter">
      <button @click="categoryFilter = null" :class="['cat-btn', { active: !categoryFilter }]">
        All Categories
      </button>
      <button @click="categoryFilter = 'ELECTRONICS'" :class="['cat-btn', { active: categoryFilter === 'ELECTRONICS' }]">
        📱 Electronics
      </button>
      <button @click="categoryFilter = 'DOCUMENTS'" :class="['cat-btn', { active: categoryFilter === 'DOCUMENTS' }]">
        📄 Documents
      </button>
      <button @click="categoryFilter = 'ACCESSORIES'" :class="['cat-btn', { active: categoryFilter === 'ACCESSORIES' }]">
        👜 Accessories
      </button>
      <button @click="categoryFilter = 'CLOTHING'" :class="['cat-btn', { active: categoryFilter === 'CLOTHING' }]">
        👕 Clothing
      </button>
      <button @click="categoryFilter = 'PETS'" :class="['cat-btn', { active: categoryFilter === 'PETS' }]">
        🐾 Pets
      </button>
      <button @click="categoryFilter = 'OTHER'" :class="['cat-btn', { active: categoryFilter === 'OTHER' }]">
        📦 Other
      </button>
    </div>

    <!-- Items List -->
    <div v-if="filteredItems.length" class="items-container">
      <div v-for="item in filteredItems" :key="item.id" class="item-card">
        <div class="item-header">
          <span :class="['item-badge', item.type.toLowerCase()]">
            {{ item.type === 'LOST' ? '🔴 LOST' : '🟢 FOUND' }}
          </span>
          <span class="category-badge">
            {{ getCategoryIcon(item.category) }} {{ formatCategory(item.category) }}
          </span>
          <span :class="['status-badge', item.status.toLowerCase()]">
            {{ item.status }}
          </span>
        </div>
        <h3 class="item-title clickable" @click="openDetailModal(item)">{{ item.title }}</h3>
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
            v-if="!isMyItem(item) && !item.claimedBy" 
            @click="handleClaim(item.id)" 
            :disabled="claimingItemId === item.id"
            class="btn btn-claim"
          >
            {{ claimingItemId === item.id ? '⏳ Claiming...' : 'Claim Item' }}
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
    @back="handleBackToInbox"
  />

  <!-- Inbox Drawer -->
  <InboxDrawer
    :is-open="isInboxOpen"
    :current-user-id="userStore.user?.uid"
    @close="isInboxOpen = false"
    @open-chat="openMessageModal"
  />

  <!-- Item Detail Modal -->
  <ItemDetailModal
    v-if="isDetailModalOpen && selectedItem"
    :is-open="isDetailModalOpen"
    :item="selectedItem"
    :is-my-item="selectedItem.userId === userStore.user?.uid"
    @close="isDetailModalOpen = false; selectedItem = null"
    @message="openMessageModal"
    @claim="handleClaim"
    @resolve="handleResolve"
    @delete="handleDelete"
    @view-match="openDetailModal"
  />
  
  <ConfirmationModal
    :is-open="showConfirmModal"
    :title="confirmModalConfig.title"
    :message="confirmModalConfig.message"
    :confirm-text="confirmModalConfig.confirmText"
    :type="confirmModalConfig.type"
    @close="showConfirmModal = false"
    @confirm="executeConfirm"
  />
  <ConfirmationModal
    :is-open="showConfirmModal"
    :title="confirmModalConfig.title"
    :message="confirmModalConfig.message"
    :confirm-text="confirmModalConfig.confirmText"
    :type="confirmModalConfig.type"
    @close="showConfirmModal = false"
    @confirm="executeConfirm"
  />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import InputForm from '@/components/InputForm.vue'
import MapDisplay from '@/components/MapDisplay.vue'
import MessagingModal from '@/components/MessagingModal.vue'
import InboxDrawer from '@/components/InboxDrawer.vue'
import ItemDetailModal from '@/components/ItemDetailModal.vue'
import ConfirmationModal from '@/components/ConfirmationModal.vue'
import { fetchItems, createItem, updateItem, deleteItem as apiDeleteItem, resolveItem, claimItem } from '../services/itemService'
import { sendMessage, getUnreadMessages } from '@/services/messageService'
import { useUserStore } from '@/stores/userStore'
import { auth } from '@/firebase'
import { signOut } from 'firebase/auth'

const router = useRouter()

const items = ref([])
const selectedImage = ref(null)
const isMessagingOpen = ref(false)
const selectedItem = ref(null)
const isDetailModalOpen = ref(false)
const isInboxOpen = ref(false)
const filterType = ref(null)
const showMyItemsOnly = ref(false)
const editingItem = ref(null)
const unreadCount = ref(0)
const claimingItemId = ref(null)
const searchQuery = ref('') // Search state
const categoryFilter = ref(null) // Category filter state
const userStore = useUserStore()
let unreadPolling = null

// Confirmation Modal State
const showConfirmModal = ref(false)
const confirmModalConfig = ref({
  title: '',
  message: '',
  confirmText: '',
  type: 'primary',
  action: null
})

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

function openDetailModal(item) {
  selectedItem.value = item
  isDetailModalOpen.value = true
}

function handleBackToInbox() {
  isMessagingOpen.value = false
  isInboxOpen.value = true
}

function getCategoryIcon(category) {
  const icons = {
    ELECTRONICS: '📱',
    DOCUMENTS: '📄',
    ACCESSORIES: '👜',
    CLOTHING: '👕',
    PETS: '🐾',
    OTHER: '📦'
  }
  return icons[category] || '📦'
}

function formatCategory(category) {
  if (!category) return 'Other'
  return category.charAt(0) + category.slice(1).toLowerCase()
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
  
  // Filter out RESOLVED items (Archived)
  filtered = filtered.filter(item => item.status !== 'RESOLVED')

  // Filter by category
  if (categoryFilter.value && categoryFilter.value !== 'ALL') {
    filtered = filtered.filter(item => item.category === categoryFilter.value)
  }
  
  // Filter by search query - REMOVED (Handled by backend now)
  /*
  if (searchQuery.value.trim()) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(item => {
      const titleMatch = item.title?.toLowerCase().includes(query)
      const descMatch = item.description?.toLowerCase().includes(query)
      return titleMatch || descMatch
    })
  }
  */
  
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

watch(searchQuery, (newQuery) => {
  loadItems(newQuery)
})

async function loadItems(search = '') {
  try {
    const data = await fetchItems(search)
    items.value = data.sort((a, b) => new Date(b.date) - new Date(a.date))
  } catch (error) {
    console.error('Error loading items:', error)
  }
}

async function handleDelete(id) {
  confirmModalConfig.value = {
    title: 'Delete Item',
    message: 'Are you sure you want to delete this item? This action cannot be undone.',
    confirmText: 'Delete',
    type: 'danger',
    action: () => performDelete(id)
  }
  showConfirmModal.value = true
}

async function performDelete(id) {
  try {
    console.log('Calling deleteItem API for id:', id);
    await apiDeleteItem(id)
    console.log('API call successful for delete');
    items.value = items.value.filter((item) => item.id !== id)
    
    // Close modal if open
    isDetailModalOpen.value = false
    selectedItem.value = null
    showConfirmModal.value = false
  } catch (error) {
    console.error('Error deleting item:', error)
  }
}

async function handleClaim(itemId) {
  if (!userStore.user) {
    console.warn('Please login to claim items.')
    return
  }
  
  claimingItemId.value = itemId
  
  try {
    // 1. Claim the item
    const updated = await claimItem(itemId, userStore.user.uid)
    
    // 2. Send automatic message to owner
    try {
      const itemType = updated.type === 'LOST' ? 'lost' : 'found'
      const messageContent = `Hi! I've claimed your ${itemType} item "${updated.title}". I believe this belongs to me. Let's discuss to verify!`
      
      await sendMessage(
        itemId,
        userStore.user.uid,  // senderId (claimer)
        updated.userId,      // receiverId (item owner)
        messageContent
      )
    } catch (messageError) {
      console.error('Failed to send automatic message:', messageError)
      // Continue even if message fails - user can message manually
    }
    
    // 3. Update UI
    const index = items.value.findIndex((item) => item.id === itemId)
    if (index !== -1) {
      items.value[index] = updated
    }
    await loadItems()
    selectedItem.value = null
    
    // 4. Success - UI already updated with claimed badge
    console.log('✅ Item claimed successfully! Message sent to owner.')
  } catch (error) {
    console.error('Error claiming item:', error)
    // Removed alert
  } finally {
    claimingItemId.value = null
  }
}

async function handleResolve(itemId) {
  confirmModalConfig.value = {
    title: 'Confirm Handover',
    message: 'Have you handed over this item? It will be marked as resolved and archived.',
    confirmText: 'Confirm Handover',
    type: 'success',
    action: () => performResolve(itemId)
  }
  showConfirmModal.value = true
}

async function performResolve(itemId) {
  try {
    console.log('Calling resolveItem API for id:', itemId);
    await resolveItem(itemId);
    console.log('API call successful for resolve');
    
    // Refresh items
    await loadItems()
    selectedItem.value = null
    isDetailModalOpen.value = false; // Close the modal
    showConfirmModal.value = false
  } catch (error) {
    console.error('Error resolving item:', error)
  }
}

function executeConfirm() {
  if (confirmModalConfig.value.action) {
    confirmModalConfig.value.action()
  }
}

function isMyItem(item) {
  return item.userId === userStore.user?.uid
}

function handleEdit(item) {
  console.log('Editing item:', item)
  // Scroll to top to show form
  window.scrollTo({ top: 0, behavior: 'smooth' })
  
  // Emit edit event to InputForm
  editingItem.value = item
}

async function addItem(itemData) {
  if (!userStore.user) {
    console.warn('User not logged in, cannot add item')
    return
  }
  
  try {
    if (editingItem.value) {
      // Update existing item
      const editingId = editingItem.value.id // Capture ID before await
      console.log('Updating item:', editingId, itemData)
      
      const updatedItem = await updateItem(editingId, {
        ...itemData,
        userId: userStore.user.uid
      })
      console.log('Item updated successfully:', updatedItem)
      
      const index = items.value.findIndex(item => item.id === editingId)
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
/* ===== CSS VARIABLES - Modern Color System ===== */
:root {
  /* Primary Colors */
  --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --primary-color: #667eea;
  --primary-dark: #5568d3;
  --primary-light: #8b9dff;
  
  /* Accent Colors */
  --accent-success: #10b981;
  --accent-success-dark: #059669;
  --accent-warning: #f59e0b;
  --accent-danger: #ef4444;
  --accent-info: #3b82f6;
  
  /* Neutral Colors */
  --bg-primary: #f8fafc;
  --bg-secondary: #ffffff;
  --bg-tertiary: #f1f5f9;
  --text-primary: #1e293b;
  --text-secondary: #64748b;
  --text-muted: #94a3b8;
  --border-color: #e2e8f0;
  --border-light: #f1f5f9;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  /* Transitions */
  --transition-fast: 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-full: 9999px;
}

/* ===== BASE STYLES ===== */
.dashboard-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background-color: var(--bg-primary);
  min-height: 100vh;
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

/* ===== SEARCH BAR ===== */
.search-container {
  margin: 1.5rem 0;
}

.search-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--bg-secondary);
  border: 2px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: 0.75rem 1rem;
  transition: all var(--transition-base);
}

.search-wrapper:focus-within {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.search-icon {
  font-size: 1.25rem;
  margin-right: 0.75rem;
  color: var(--text-secondary);
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 1rem;
  font-family: inherit;
  background: transparent;
  color: var(--text-primary);
}

.search-input::placeholder {
  color: var(--text-muted);
}

.search-clear {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  margin-left: 0.5rem;
}

.search-clear:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

/* ===== CATEGORY FILTER ===== */
.category-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 2rem;
  justify-content: center;
}

.cat-btn {
  padding: 0.5rem 1rem;
  background: white;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-full);
  font-size: 0.9rem;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-base);
}

.cat-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
  border-color: var(--primary-200);
}

.cat-btn.active {
  background: var(--primary-color);
  color: white;
  border-color: var(--primary-color);
  box-shadow: var(--shadow-sm);
}

/* ===== FILTER TABS ===== */

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
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: 24px;
  box-shadow: var(--shadow-md);
  transition: all var(--transition-base);
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.item-card:hover {
  box-shadow: var(--shadow-xl);
  transform: translateY(-4px);
  border-color: var(--primary-light);
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
  color: hsl(142, 76%, 36%);
}

.item-title.clickable {
  cursor: pointer;
  color: var(--primary-color);
  text-decoration: underline;
  text-underline-offset: 4px;
}

.item-title.clickable:hover {
  color: var(--primary-dark);
}

.category-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.75rem;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border-radius: var(--radius-full);
  font-size: 0.75rem;
  font-weight: 500;
  border: 1px solid var(--border-color);
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
  background: var(--primary-gradient);
  color: var(--text-primary);
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.25);
}

.btn-claim:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35);
}

.btn-claim:active {
  transform: translateY(0);
}

.btn-edit {
  background: var(--bg-secondary);
  color: var(--primary-color);
  border: 2px solid var(--primary-color);
}

.btn-edit:hover {
  background: var(--primary-color);
  color: white;
  transform: translateY(-2px);
}

.btn-message {
  background: var(--accent-info);
  color: var(--text-primary);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.25);
}

.btn-message:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.35);
}

.claimed-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 16px;
  background: linear-gradient(135deg, var(--accent-success) 0%, var(--accent-success-dark) 100%);
  color: var(--text-primary);
  border-radius: var(--radius-full);
  font-weight: 500;
  font-size: 0.875rem;
  box-shadow: 0 2px 6px rgba(16, 185, 129, 0.25);
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
