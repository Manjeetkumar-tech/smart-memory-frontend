<template>
  <div class="image-upload-container">
    <div class="upload-area" @click="triggerFileInput">
      <input 
        ref="fileInput"
        type="file" 
        accept="image/*" 
        multiple
        @change="handleFileSelect"
        style="display: none"
      />
      <div v-if="!uploadedImages.length" class="upload-prompt">
        <span class="upload-icon">📷</span>
        <p>Click to upload images</p>
        <p class="upload-hint">Support JPG, PNG, WebP (max 5MB each, up to 5 images)</p>
      </div>
    </div>

    <!-- Image Previews -->
    <div v-if="uploadedImages.length" class="images-preview">
      <div 
        v-for="(img, index) in uploadedImages" 
        :key="index" 
        class="preview-item"
      >
        <img :src="img.url" :alt="`Preview ${index + 1}`" class="preview-image" />
        <button @click="removeImage(index)" class="remove-btn" type="button">
          ✕
        </button>
        <div v-if="img.uploading" class="upload-progress">
          <div class="progress-bar" :style="{ width: img.progress + '%' }"></div>
        </div>
      </div>
      <div 
        v-if="uploadedImages.length < 5" 
        class="add-more"
        @click="triggerFileInput"
      >
        <span class="add-icon">+</span>
      </div>
    </div>

    <!-- Error Message -->
    <p v-if="error" class="error-message">{{ error }}</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['update:modelValue'])
const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
})

const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

const fileInput = ref(null)
const uploadedImages = ref([])
const error = ref('')

function triggerFileInput() {
  fileInput.value?.click()
}

async function handleFileSelect(event) {
  const files = Array.from(event.target.files)
  error.value = ''
  
  // Check total count
  if (uploadedImages.value.length + files.length > 5) {
    error.value = 'Maximum 5 images allowed'
    return
  }
  
  for (const file of files) {
    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      error.value = `${file.name} is too large. Max size is 5MB.`
      continue
    }
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      error.value = `${file.name} is not an image file.`
      continue
    }
    
    await uploadImage(file)
  }
  
  // Clear input
  event.target.value = ''
}

async function uploadImage(file) {
  // Add to preview immediately
  const imageObj = {
    url: URL.createObjectURL(file),
    uploading: true,
    progress: 0
  }
  uploadedImages.value.push(imageObj)
  const index = uploadedImages.value.length - 1
  
  try {
    // Create FormData for Cloudinary upload
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', uploadPreset)
    
    // Upload to Cloudinary with progress tracking
    const xhr = new XMLHttpRequest()
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 100
        uploadedImages.value[index].progress = progress
      }
    })
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        const response = JSON.parse(xhr.responseText)
        uploadedImages.value[index].url = response.secure_url
        uploadedImages.value[index].uploading = false
        uploadedImages.value[index].publicId = response.public_id
        emitUrls()
      } else {
        error.value = 'Upload failed'
        uploadedImages.value.splice(index, 1)
      }
    })
    
    xhr.addEventListener('error', () => {
      error.value = 'Upload failed'
      uploadedImages.value.splice(index, 1)
    })
    
    xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`)
    xhr.send(formData)
    
  } catch (err) {
    console.error('Upload error:', err)
    error.value = 'Failed to upload image'
    uploadedImages.value.splice(index, 1)
  }
}

function removeImage(index) {
  uploadedImages.value.splice(index, 1)
  emitUrls()
}

function emitUrls() {
  const urls = uploadedImages.value
    .filter(img => !img.uploading)
    .map(img => img.url)
  emit('update:modelValue', urls)
}
</script>

<style scoped>
.image-upload-container {
  margin: 1rem 0;
}

.upload-area {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: 2rem;
  text-align: center;
  cursor: pointer;
  transition: all var(--transition-base);
  background: hsl(0, 0%, 98%);
}

.upload-area:hover {
  border-color: var(--primary-400);
  background: hsl(180, 80%, 98%);
}

.upload-prompt {
  color: var(--color-text-muted);
}

.upload-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.5rem;
}

.upload-hint {
  font-size: 0.85rem;
  margin-top: 0.5rem;
}

.images-preview {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 2px solid var(--color-border);
}

.preview-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 0.25rem;
  right: 0.25rem;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  transition: background var(--transition-base);
}

.remove-btn:hover {
  background: var(--error);
}

.upload-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: rgba(0, 0, 0, 0.2);
}

.progress-bar {
  height: 100%;
  background: var(--success);
  transition: width 0.3s ease;
}

.add-more {
  aspect-ratio: 1;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: hsl(0, 0%, 98%);
  transition: all var(--transition-base);
}

.add-more:hover {
  border-color: var(--primary-400);
  background: hsl(180, 80%, 98%);
}

.add-icon {
  font-size: 2rem;
  color: var(--color-text-muted);
}

.error-message {
  color: var(--error);
  font-size: 0.9rem;
  margin-top: 0.5rem;
}
</style>
