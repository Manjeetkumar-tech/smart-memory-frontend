<template>
  <form @submit.prevent="submitItem" class="input-form">
    <div class="form-header">
      <h3 class="form-title">📦 Report Lost/Found Item</h3>
    </div>
    
    <div class="form-row">
      <select v-model="itemType" class="form-select" required>
        <option value="">Select Type</option>
        <option value="LOST">Lost Item</option>
        <option value="FOUND">Found Item</option>
      </select>
      
      <select v-model="category" class="form-select" required>
        <option value="">Select Category</option>
        <option value="ELECTRONICS">📱 Electronics</option>
        <option value="DOCUMENTS">📄 Documents</option>
        <option value="ACCESSORIES">👜 Accessories</option>
        <option value="CLOTHING">👕 Clothing</option>
        <option value="PETS">🐾 Pets</option>
        <option value="OTHER">📦 Other</option>
      </select>
    </div>

    <input
      v-model="title"
      type="text"
      placeholder="Item name (e.g. Blue Backpack)"
      class="form-input"
      required
    />

    <textarea
      v-model="description"
      placeholder="Describe the item in detail..."
      rows="4"
      class="form-textarea"
      required
    ></textarea>

    <div class="form-row">
      <LocationSearch
        v-model="location"
        placeholder="Search for location..."
        @location-selected="handleLocationSelected"
        class="location-search-wrapper"
      />
      <input
        v-model="date"
        type="date"
        class="form-input"
        required
      />
    </div>

    <input
      v-model="contactInfo"
      type="email"
      placeholder="Contact Email"
      class="form-input"
      required
    />

    <!-- Image Upload -->
    <ImageUpload v-model="imageUrls" :key="formKey" />

    <button type="submit" class="submit-btn">
      <span class="btn-icon">{{ editingItem ? '💾' : '📤' }}</span>
      {{ editingItem ? 'Update Item' : 'Submit Report' }}
    </button>
  </form>
</template>

<script setup>
import { ref, watch } from 'vue'
import LocationSearch from './LocationSearch.vue'
import ImageUpload from './ImageUpload.vue'

const emit = defineEmits(['submit-item', 'clear-edit'])
const props = defineProps({
  editingItem: {
    type: Object,
    default: null
  }
})

const title = ref('')
const description = ref('')
const location = ref('')
const latitude = ref(null)
const longitude = ref(null)
const date = ref('')
const itemType = ref('')
const contactInfo = ref('')
const imageUrls = ref([])
const formKey = ref(0) // Key to force ImageUpload reset

// Watch for editing item changes
watch(() => props.editingItem, (newItem) => {
  if (newItem) {
    title.value = newItem.title || ''
    description.value = newItem.description || ''
    location.value = newItem.location || ''
    latitude.value = newItem.latitude
    longitude.value = newItem.longitude
    date.value = newItem.date || ''
    itemType.value = newItem.type || ''
    contactInfo.value = newItem.contactInfo || ''
    imageUrls.value = newItem.imageUrls || []
    formKey.value++ // Reset ImageUpload with existing images
  }
})

function handleLocationSelected(locationData) {
  location.value = locationData.address
  latitude.value = locationData.latitude
  longitude.value = locationData.longitude
}

function submitItem() {
  if (!title.value.trim() || !description.value.trim() || !itemType.value) return
  
  emit('submit-item', {
    title: title.value,
    description: description.value,
    location: location.value,
    latitude: latitude.value,
    longitude: longitude.value,
    date: date.value,
    type: itemType.value,
    contactInfo: contactInfo.value,
    imageUrls: imageUrls.value,
    status: 'OPEN'
  })
  
  // Reset form
  title.value = ''
  description.value = ''
  location.value = ''
  latitude.value = null
  longitude.value = null
  date.value = ''
  itemType.value = ''
  contactInfo.value = ''
  imageUrls.value = []
  formKey.value++ // Force ImageUpload component to reset
  emit('clear-edit') // Clear editing state in parent
}
</script>

<style scoped>
.input-form {
  background: var(--gradient-card);
  backdrop-filter: blur(10px);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-xl);
  padding: 2rem;
  box-shadow: var(--shadow-lg);
  margin: 2rem 0;
  position: relative;
  overflow: hidden;
}

.input-form::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gradient-accent);
}

.form-header {
  margin-bottom: 1.25rem;
}

.form-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-heading);
  background: var(--gradient-accent);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.form-textarea {
  width: 100%;
  padding: 1rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  resize: vertical;
  font-family: inherit;
  font-size: 1rem;
  line-height: 1.6;
  transition: all var(--transition-base);
  background: white;
  color: var(--color-heading);
  margin-bottom: 1rem;
}

.form-textarea::placeholder {
  color: var(--color-text-muted);
}

.form-textarea:focus {
  outline: none;
  border-color: var(--accent-500);
  box-shadow: 0 0 0 4px hsl(180, 80%, 92%);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.location-search-wrapper {
  flex: 1;
}

.form-input,
.form-select {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 0.95rem;
  transition: all var(--transition-base);
  background: white;
  color: var(--color-heading);
}

.form-input::placeholder {
  color: var(--color-text-muted);
}

.form-input:focus,
.form-select:focus {
  outline: none;
  border-color: var(--accent-500);
  box-shadow: 0 0 0 4px hsl(180, 80%, 92%);
}

.submit-btn {
  width: 100%;
  padding: 0.875rem 1.5rem;
  background: var(--gradient-accent);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-md);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg), 0 0 20px rgba(100, 200, 255, 0.3);
}

.submit-btn:active {
  transform: translateY(0);
}

.btn-icon {
  font-size: 1.1rem;
}

@media (max-width: 640px) {
  .input-form {
    padding: 1.5rem;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-title {
    font-size: 1.1rem;
  }
}
</style>
