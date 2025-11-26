<template>
  <div v-if="isOpen" class="inbox-overlay" @click="close">
    <div class="inbox-drawer" @click.stop>
      <div class="inbox-header">
        <h3>📬 Inbox</h3>
        <button @click="close" class="close-btn">✕</button>
      </div>

      <div class="conversations-list">
        <div v-if="loading" class="loading-state">
          Loading messages...
        </div>
        
        <div v-else-if="conversations.length === 0" class="empty-state">
          <p>No messages yet.</p>
        </div>

        <div 
          v-else
          v-for="conv in conversations" 
          :key="conv.itemId"
          class="conversation-item"
          @click="openConversation(conv)"
        >
          <div class="conv-content">
            <div class="conv-header">
              <span class="item-title">{{ conv.itemTitle || 'Unknown Item' }}</span>
              <span class="time">{{ formatTime(conv.lastMessage.timestamp) }}</span>
            </div>
            <p class="last-message">{{ conv.lastMessage.content }}</p>
          </div>
          <div v-if="conv.unreadCount > 0" class="unread-badge">
            {{ conv.unreadCount }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { getUserMessages, getUnreadMessages } from '@/services/messageService'
import { fetchItems } from '@/services/itemService'

const props = defineProps({
  isOpen: Boolean,
  currentUserId: String
})

const emit = defineEmits(['close', 'open-chat'])

const conversations = ref([])
const loading = ref(false)

watch(() => props.isOpen, (isOpen) => {
  if (isOpen) {
    loadInbox()
  }
})

async function loadInbox() {
  if (!props.currentUserId) return
  
  loading.value = true
  try {
    // 1. Get all messages received by user
    const messages = await getUserMessages(props.currentUserId)
    
    // 2. Get all items to map titles
    // Note: In a real app, we'd have a better endpoint for this
    const allItems = await fetchItems()
    const itemMap = new Map(allItems.map(i => [i.id, i]))

    // 3. Group by itemId
    const groups = {}
    
    messages.forEach(msg => {
      if (!groups[msg.itemId]) {
        groups[msg.itemId] = {
          itemId: msg.itemId,
          itemTitle: itemMap.get(msg.itemId)?.title || 'Unknown Item',
          messages: [],
          lastMessage: null,
          unreadCount: 0,
          item: itemMap.get(msg.itemId) // Store full item for opening chat
        }
      }
      
      groups[msg.itemId].messages.push(msg)
      
      // Update last message (assuming sorted by desc)
      if (!groups[msg.itemId].lastMessage || 
          new Date(msg.timestamp) > new Date(groups[msg.itemId].lastMessage.timestamp)) {
        groups[msg.itemId].lastMessage = msg
      }
      
      if (!msg.read) {
        groups[msg.itemId].unreadCount++
      }
    })

    // Convert to array and sort by last message time
    conversations.value = Object.values(groups).sort((a, b) => 
      new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
    )
    
  } catch (error) {
    console.error('Error loading inbox:', error)
  } finally {
    loading.value = false
  }
}

function openConversation(conv) {
  if (conv.item) {
    emit('open-chat', conv.item)
    emit('close')
  }
}

function close() {
  emit('close')
}

function formatTime(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h`
  
  return date.toLocaleDateString()
}
</script>

<style scoped>
.inbox-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: flex-end;
  z-index: 9999; /* Just below messaging modal */
  animation: fadeIn 0.2s ease;
}

.inbox-drawer {
  background: white;
  width: 100%;
  max-width: 350px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  box-shadow: -5px 0 30px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.inbox-header {
  padding: 1rem;
  background: var(--primary-500);
  color: white;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.inbox-header h3 {
  margin: 0;
  font-size: 1.1rem;
}

.close-btn {
  background: none;
  border: none;
  color: white;
  font-size: 1.2rem;
  cursor: pointer;
}

.conversations-list {
  flex: 1;
  overflow-y: auto;
}

.conversation-item {
  padding: 1rem;
  border-bottom: 1px solid #eee;
  cursor: pointer;
  transition: background 0.2s;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.conversation-item:hover {
  background: #f9f9f9;
}

.conv-content {
  flex: 1;
  min-width: 0; /* For text truncation */
}

.conv-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.25rem;
}

.item-title {
  font-weight: 600;
  color: var(--color-heading);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time {
  font-size: 0.75rem;
  color: var(--color-text-muted);
  margin-left: 0.5rem;
}

.last-message {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.unread-badge {
  background: var(--error);
  color: white;
  font-size: 0.75rem;
  padding: 0.1rem 0.4rem;
  border-radius: 10px;
  margin-left: 0.5rem;
  min-width: 18px;
  text-align: center;
}

.loading-state, .empty-state {
  padding: 2rem;
  text-align: center;
  color: var(--color-text-muted);
}
</style>
