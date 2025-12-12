<template>
  <div v-if="isOpen" class="modal-overlay" @click="$emit('close')">
    <div class="modal-content" @click.stop>
      <button class="close-btn" @click="$emit('close')">✕</button>
      
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

      <h2 class="item-title">{{ item.title }}</h2>
      <p class="item-date">Posted on {{ formatDate(item.date) }}</p>

      <div class="item-body">
        <div v-if="item.imageUrls && item.imageUrls.length" class="main-image-container">
          <img :src="item.imageUrls[0]" :alt="item.title" class="main-image" />
        </div>
        
        <p class="description">{{ item.description }}</p>
        
        <div class="details-grid">
          <div class="detail-row">
            <strong>📍 Location:</strong> {{ item.location }}
          </div>
          <div class="detail-row">
            <strong>📞 Contact:</strong> {{ item.contactInfo }}
          </div>
        </div>
      </div>

      <!-- Potential Matches Section -->
      <div class="matches-section">
        <h3 class="matches-title">
          ✨ Potential Matches
          <span class="matches-subtitle">(Based on category & keywords)</span>
        </h3>
        
        <div v-if="loadingMatches" class="loading-matches">
          Searching for matches... 🤖
        </div>
        
        <div v-else-if="matches.length > 0" class="matches-list">
          <div v-for="match in matches" :key="match.id" class="match-card" @click="$emit('view-match', match)">
            <div class="match-header">
              <span :class="['match-badge', match.type.toLowerCase()]">
                {{ match.type === 'LOST' ? 'LOST' : 'FOUND' }}
              </span>
              <span class="match-date">{{ formatDate(match.date) }}</span>
            </div>
            <h4 class="match-title">{{ match.title }}</h4>
            <p class="match-location">📍 {{ match.location }}</p>
          </div>
        </div>
        
        <div v-else class="no-matches">
          No potential matches found yet.
        </div>
      </div>

      <div class="modal-actions">
        <button v-if="!isMyItem" @click="$emit('message', item)" class="btn btn-message">
          💬 Message Owner
        </button>
        <button v-if="!isMyItem && item.status === 'OPEN'" @click="$emit('claim', item.id)" class="btn btn-claim">
          ✋ Claim Item
        </button>
        
        <!-- Owner Actions -->
        <button v-if="isMyItem && item.status === 'CLAIMED'" @click="$emit('resolve', item.id)" class="btn btn-resolve">
          ✅ Confirm Handover
        </button>
        <button v-if="isMyItem" @click="$emit('delete', item.id)" class="btn btn-delete">
          🗑️ Delete
        </button>
        
        <!-- Revert Actions -->
        <button v-if="item.status === 'CLAIMED' && item.claimedBy === userStore.user?.uid" @click="$emit('unclaim', item.id)" class="btn btn-warning">
          🚫 Cancel Claim
        </button>
        <button v-if="isMyItem && item.status === 'RESOLVED'" @click="$emit('unresolve', item.id)" class="btn btn-warning">
          ↩️ Undo Handover
        </button>
        
        <!-- Status Badges -->
        <div v-if="item.status === 'CLAIMED' && !isMyItem" class="status-badge pending">
          ⏳ Waiting for Owner Confirmation
        </div>
        <div v-if="item.status === 'RESOLVED'" class="status-badge resolved">
          🎉 Item Returned!
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import { useUserStore } from '@/stores/userStore'

const props = defineProps({
  isOpen: Boolean,
  item: Object
})

const emit = defineEmits(['close', 'message', 'claim', 'view-match', 'resolve', 'delete', 'unclaim', 'unresolve'])
const userStore = useUserStore()
const matches = ref([])
const loadingMatches = ref(false)

const isMyItem = computed(() => {
  const itemUserId = props.item?.userId
  const currentUserId = userStore.user?.uid
  const match = itemUserId === currentUserId
  console.log('ItemDetailModal: isMyItem check:', { itemUserId, currentUserId, match, status: props.item?.status })
  return match
})

watch(() => props.item, async (newItem) => {
  if (newItem && props.isOpen) {
    await fetchMatches(newItem.id)
  }
})

watch(() => props.isOpen, async (isOpen) => {
  if (isOpen && props.item) {
    await fetchMatches(props.item.id)
  }
})

async function fetchMatches(itemId) {
  loadingMatches.value = true
  try {
    const response = await fetch(`http://localhost:8080/api/items/${itemId}/matches`)
    if (response.ok) {
      matches.value = await response.json()
    }
  } catch (e) {
    console.error("Error fetching matches:", e)
  } finally {
    loadingMatches.value = false
  }
}

function formatDate(dateString) {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString()
}

function getCategoryIcon(category) {
  const icons = {
    ELECTRONICS: '📱', DOCUMENTS: '📄', ACCESSORIES: '👜',
    CLOTHING: '👕', PETS: '🐾', OTHER: '📦'
  }
  return icons[category] || '📦'
}

function formatCategory(category) {
  if (!category) return 'Other'
  return category.charAt(0) + category.slice(1).toLowerCase()
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(4px);
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  position: relative;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #64748b;
}

.item-header {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.item-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1e293b;
  margin: 0 0 4px 0;
}

.item-date {
  color: #64748b;
  font-size: 0.9rem;
  margin-bottom: 16px;
}

.main-image-container {
  width: 100%;
  height: 200px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
}

.main-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.description {
  color: #334155;
  line-height: 1.6;
  margin-bottom: 16px;
}

.details-grid {
  background: #f8fafc;
  padding: 16px;
  border-radius: 12px;
  display: grid;
  gap: 8px;
}

/* Matches Section */
.matches-section {
  margin-top: 24px;
  border-top: 1px solid #e2e8f0;
  padding-top: 16px;
}

.matches-title {
  font-size: 1.1rem;
  color: #1e293b;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.matches-subtitle {
  font-size: 0.8rem;
  color: #64748b;
  font-weight: normal;
}

.matches-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
}

.match-card {
  background: #f1f5f9;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: transform 0.2s;
  border: 1px solid transparent;
}

.match-card:hover {
  transform: translateY(-2px);
  border-color: #667eea;
  background: white;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.match-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  margin-bottom: 4px;
}

.match-title {
  font-size: 0.95rem;
  margin: 0 0 4px 0;
  color: #1e293b;
}

.match-location {
  font-size: 0.8rem;
  color: #64748b;
  margin: 0;
}

.match-badge.lost { color: #ef4444; font-weight: bold; }
.match-badge.found { color: #10b981; font-weight: bold; }

.loading-matches, .no-matches {
  text-align: center;
  padding: 20px;
  color: #64748b;
  font-style: italic;
  background: #f8fafc;
  border-radius: 8px;
}

.modal-actions {
  margin-top: 24px;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

.btn {
  padding: 8px 16px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  border: none;
}

.btn-message { background: #3b82f6; color: white; }
.btn-claim { background: #10b981; color: white; }
.btn-resolve { background: #8b5cf6; color: white; }
.btn-delete { background: #ef4444; color: white; }
.btn-warning { background: #f59e0b; color: white; }
</style>
