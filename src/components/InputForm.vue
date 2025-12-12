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
    <ImageUpload v-model="imageUrls" :key="formKey" @image-added="handleImageAdded" />

    <div v-if="lastUploadedFile" class="ai-actions">
      <button type="button" @click="analyzeImage" class="ai-btn" :disabled="isAnalyzing">
        <span v-if="isAnalyzing">🤖 Analyzing...</span>
        <span v-else>✨ Auto-Fill with AI</span>
      </button>
      <p class="ai-hint">Gemini AI will analyze the image to fill details.</p>
    </div>

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
const category = ref('')
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
    category.value = newItem.category || 'OTHER' // Default to OTHER for legacy items
    contactInfo.value = newItem.contactInfo || ''
    imageUrls.value = newItem.imageUrls || []
    formKey.value++ // Reset ImageUpload with existing images
  }
})

const lastUploadedFile = ref(null)
const isAnalyzing = ref(false)

function handleImageAdded(file) {
  lastUploadedFile.value = file
}

async function analyzeImage() {
  if (!lastUploadedFile.value) return
  
  isAnalyzing.value = true
  try {
    const formData = new FormData()
    formData.append('image', lastUploadedFile.value)
    
    const response = await fetch('http://localhost:8080/api/ai/analyze', {
      method: 'POST',
      body: formData
    })
    
    if (!response.ok) throw new Error('AI Analysis failed')
    
    const data = await response.json()
    
    // Auto-fill fields
    if (data.title) title.value = data.title
    if (data.description) description.value = data.description
    if (data.category) {
      // Map AI category to our categories
      const validCategories = ['ELECTRONICS', 'DOCUMENTS', 'ACCESSORIES', 'CLOTHING', 'PETS', 'OTHER']
      const aiCat = data.category.toUpperCase()
      if (validCategories.includes(aiCat)) {
        category.value = aiCat
      } else {
        category.value = 'OTHER'
      }
    }
    
  } catch (error) {
    console.error('AI Error:', error)
    alert('Failed to analyze image. Please try again.')
  } finally {
    isAnalyzing.value = false
  }
}

function handleLocationSelected(locationData) {
  location.value = locationData.address
  latitude.value = locationData.latitude
  longitude.value = locationData.longitude
}

function submitItem() {
  if (!title.value.trim() || !description.value.trim() || !itemType.value || !category.value) return
  
  emit('submit-item', {
    title: title.value,
    description: description.value,
    location: location.value,
    latitude: latitude.value,
    longitude: longitude.value,
    date: date.value,
    type: itemType.value,
    category: category.value,
    contactInfo: contactInfo.value,
    contactInfo: contactInfo.value,
    imageUrls: imageUrls.value,
    status: props.editingItem ? props.editingItem.status : 'OPEN'
  })
  
  // Reset form
  title.value = ''
  description.value = ''
  location.value = ''
  latitude.value = null
  longitude.value = null
  date.value = ''
  itemType.value = ''
  category.value = ''
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

.ai-actions {
  margin: 1rem 0;
  text-align: center;
}

.ai-btn {
  background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: var(--radius-full);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-md);
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.ai-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

.ai-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

.ai-hint {
  font-size: 0.8rem;
  color: var(--color-text-muted);
  margin-top: 0.5rem;
}
</style>
