<template>
  <div v-if="isOpen" class="message-modal-overlay" @click="close">
    <div class="message-modal" @click.stop>
      <div class="modal-header">
        <h3>💬 "{{ item?.title }}"</h3>
        <p class="chat-with">Chat with: {{ item?.contactInfo || 'Owner' }}</p>
        <button @click="close" class="close-btn">✕</button>
      </div>

      <div class="messages-container" ref="messagesContainer">
        <div v-if="messages.length === 0" class="no-messages">
          <p>No messages yet. Start the conversation!</p>
        </div>
        
        <div 
          v-for="message in messages" 
          :key="message.id"
          :class="['message', message.senderId === currentUserId ? 'sent' : 'received']"
        >
          <div class="message-content">
            <p>{{ message.content }}</p>
            <span class="message-time">
              {{ formatTime(message.timestamp) }}
              <span v-if="message.senderId === currentUserId" class="read-receipt">
                {{ message.read ? '✓✓' : '✓' }}
              </span>
            </span>
          </div>
        </div>
      </div>

      <div class="message-input-container">
        <input
          v-model="newMessage"
          type="text"
          placeholder="Type your message..."
          class="message-input"
          @keyup.enter="send"
        />
        <button @click="send" class="send-btn" :disabled="!newMessage.trim()">
          Send
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onUnmounted } from 'vue'
import { sendMessage, getItemMessages, markAsRead } from '@/services/messageService'

const props = defineProps({
  isOpen: Boolean,
  item: Object,
  currentUserId: String
})

const emit = defineEmits(['close'])

const messages = ref([])
const newMessage = ref('')
const messagesContainer = ref(null)
let pollingInterval = null

watch(() => props.isOpen, async (isOpen) => {
  if (isOpen && props.item) {
    await loadMessages()
    startPolling()
    scrollToBottom()
  } else {
    stopPolling()
  }
})

async function loadMessages() {
  if (!props.item) return
  
  try {
    const data = await getItemMessages(props.item.id)
    messages.value = data
    
    // Mark messages as read
    for (const message of data) {
      if (message.receiverId === props.currentUserId && !message.read) {
        await markAsRead(message.id)
      }
    }
    
    scrollToBottom()
  } catch (error) {
    console.error('Error loading messages:', error)
  }
}

function startPolling() {
  // Poll for new messages every 5 seconds
  pollingInterval = setInterval(loadMessages, 5000)
}

function stopPolling() {
  if (pollingInterval) {
    clearInterval(pollingInterval)
    pollingInterval = null
  }
}

async function send() {
  if (!newMessage.value.trim() || !props.item) return
  
  try {
    await sendMessage(
      props.item.id,
      props.currentUserId,
      props.item.userId, // Send to item owner
      newMessage.value.trim()
    )
    
    newMessage.value = ''
    await loadMessages()
  } catch (error) {
    console.error('Error sending message:', error)
    alert('Failed to send message')
  }
}

function close() {
  emit('close')
}

function scrollToBottom() {
  setTimeout(() => {
    if (messagesContainer.value) {
      messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
  }, 100)
}

function formatTime(timestamp) {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now - date
  const diffMins = Math.floor(diffMs / 60000)
  
  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours}h ago`
  
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

onUnmounted(() => {
  stopPolling()
})
</script>

<style scoped>
.message-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: flex-end; /* Align to right */
  z-index: 10000;
  animation: fadeIn 0.2s ease;
}

.message-modal {
  background: white;
  width: 100%;
  max-width: 400px; /* Narrower for side drawer */
  height: 100vh; /* Full height */
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  box-shadow: -5px 0 30px rgba(0, 0, 0, 0.2);
  border-radius: 0; /* No rounded corners on side */
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.modal-header {
  padding: 1rem;
  background: var(--primary-500);
  color: white;
  border-bottom: none;
  position: relative;
}

.modal-header h3 {
  color: white;
  font-size: 1.1rem;
  margin: 0 0 0.25rem 0;
}

.chat-with {
  color: rgba(255, 255, 255, 0.9);
  font-size: 0.85rem;
  margin: 0;
  font-weight: 400;
}

.close-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background: none;
  border: none;
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.5rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: white;
}

.messages-container {
  background: #f5f7fa;
  max-height: none; /* Fill remaining space */
}

.message-input-container {
  padding: 1rem;
  background: white;
  border-top: 1px solid #eee;
}

.message-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.95rem;
  transition: all var(--transition-base);
}

.message-input:focus {
  outline: none;
  border-color: var(--primary-400);
}

.send-btn {
  padding: 0.75rem 1.5rem;
  background: var(--primary-500);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
}

.send-btn:hover:not(:disabled) {
  background: var(--primary-600);
}

.send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.read-receipt {
  margin-left: 0.25rem;
  font-size: 0.7rem;
  color: var(--color-text-muted);
}

.message.sent .read-receipt {
  color: #1976d2;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
