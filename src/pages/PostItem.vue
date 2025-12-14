<template>
  <div class="post-page">
    <header class="page-header">
      <button @click="router.push('/dashboard')" class="back-btn">
        ← Back to Dashboard
      </button>
    </header>

    <div class="form-container">
      <InputForm 
        @submit-item="handleSubmit" 
        :editing-item="editingItem"
        @clear-edit="clearEdit"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import InputForm from '@/components/InputForm.vue'
import { createItem, updateItem } from '@/services/itemService'
import { useUserStore } from '@/stores/userStore'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const editingItem = ref(null)

// Handle submit from InputForm
async function handleSubmit(itemData) {
  if (!userStore.user) {
    alert('Please log in to post items.')
    return
  }

  try {
    if (editingItem.value) {
      await updateItem(editingItem.value.id, {
        ...itemData,
        userId: userStore.user.uid
      })
    } else {
      await createItem({
        ...itemData,
        userId: userStore.user.uid
      })
    }
    // Redirect to dashboard on success
    router.push('/dashboard')
  } catch (error) {
    console.error('Error saving item:', error)
    alert('Failed to save item. Please try again.')
  }
}

function clearEdit() {
  editingItem.value = null
}

// TODO: Handle 'edit' query param if we want to support deep linking 
// for editing in the future, e.g. /post?editId=123
</script>

<style scoped>
.post-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem 1.5rem;
  min-height: 100vh;
  background-color: var(--bg-primary);
}

.page-header {
  margin-bottom: 2rem;
}

.back-btn {
  background: none;
  border: none;
  color: var(--text-secondary);
  font-weight: 500;
  cursor: pointer;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  transition: color 0.2s;
}

.back-btn:hover {
  color: var(--primary-color);
}

.form-container {
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
