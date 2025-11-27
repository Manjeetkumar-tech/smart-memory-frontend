<template>
  <div v-if="isOpen" class="message-modal-overlay" @click="close">
    <div class="message-modal" @click.stop>
      <div class="modal-header">
        <button @click="goBack" class="back-btn" title="Go back to inbox">
          ← Back
        </button>
        <div class="header-content">
          <h3>💬 "{{ item?.title }}"</h3>
          <p class="chat-with">{{ item?.contactInfo || 'Owner' }}</p>
        </div>
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

const emit = defineEmits(['close', 'back'])

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

function goBack() {
  emit('back')
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
  padding: 1rem 1.25rem;
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.back-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.back-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.header-content {
  flex: 1;
  min-width: 0;
}

.modal-header h3 {
  color: white;
  font-size: 1rem;
  margin: 0 0 0.15rem 0;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.chat-with {
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.8rem;
  margin: 0;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.close-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: white;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.4rem 0.6rem;
  line-height: 1;
  border-radius: var(--radius-md);
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 1.5rem 1rem;
  background: linear-gradient(to bottom, #e8eef3, #f5f7fa);
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.no-messages {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

.message {
  display: flex;
  margin-bottom: 0.5rem;
  animation: messageSlideIn 0.2s ease-out;
}

@keyframes messageSlideIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.message.received {
  justify-content: flex-start;
}

.message.sent {
  justify-content: flex-end;
}

.message-content {
  max-width: 75%;
  padding: 0.75rem 1rem;
  border-radius: 1rem;
  position: relative;
  word-wrap: break-word;
}

.message.received .message-content {
  background: white;
  border-bottom-left-radius: 0.25rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.message.sent .message-content {
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
  border-bottom-right-radius: 0.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.message-content p {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.4;
}

.message-time {
  display: block;
  font-size: 0.7rem;
  margin-top: 0.35rem;
  opacity: 0.7;
}

.message-input-container {
  padding: 1rem 1.25rem;
  background: white;
  border-top: 1px solid #e0e0e0;
  display: flex;
  gap: 0.75rem;
  align-items: center;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

.message-input {
  flex: 1;
  padding: 0.75rem 1rem;
  border: 2px solid #e0e0e0;
  border-radius: 1.5rem;
  font-size: 0.95rem;
  transition: all 0.2s;
  background: #f8f9fa;
}

.message-input:focus {
  outline: none;
  border-color: var(--primary-400);
  background: white;
  box-shadow: 0 0 0 3px rgba(33, 150, 243, 0.1);
}

.send-btn {
  padding: 0.75rem 1.5rem;
  background: linear-gradient(135deg, var(--primary-500), var(--primary-600));
  color: white;
  border: none;
  border-radius: 1.5rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(33, 150, 243, 0.3);
  text-transform: uppercase;
  font-size: 0.85rem;
  letter-spacing: 0.5px;
}

.send-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, var(--primary-600), var(--primary-700));
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
  transform: translateY(-1px);
}

.send-btn:active:not(:disabled) {
  transform: translateY(0);
}

.send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  box-shadow: none;
}

.read-receipt {
  margin-left: 0.35rem;
  font-size: 0.65rem;
}

.message.sent .read-receipt {
  color: rgba(255, 255, 255, 0.8);
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
</style>
