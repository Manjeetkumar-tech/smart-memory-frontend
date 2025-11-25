<template>
  <div class="location-search">
    <input
      v-model="searchQuery"
      type="text"
      :placeholder="placeholder"
      class="search-input"
      @input="handleSearch"
      @focus="showResults = true"
    />
    <div v-if="showResults && results.length > 0" class="results-dropdown">
      <div
        v-for="result in results"
        :key="result.place_id"
        class="result-item"
        @click="selectLocation(result)"
      >
        <div class="result-name">{{ result.display_name }}</div>
      </div>
    </div>
    <div v-if="searching" class="loading">Searching...</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  placeholder: {
    type: String,
    default: 'Search for a location...'
  },
  modelValue: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['update:modelValue', 'location-selected'])

const searchQuery = ref(props.modelValue)
const results = ref([])
const showResults = ref(false)
const searching = ref(false)
let searchTimeout = null

async function handleSearch() {
  emit('update:modelValue', searchQuery.value)
  
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  if (searchQuery.value.length < 3) {
    results.value = []
    return
  }
  
  searchTimeout = setTimeout(async () => {
    searching.value = true
    try {
      // Use Nominatim API for OpenStreetMap geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&q=${encodeURIComponent(searchQuery.value)}&limit=5`,
        {
          headers: {
            'User-Agent': 'LostAndFoundApp/1.0'
          }
        }
      )
      results.value = await response.json()
    } catch (error) {
      console.error('Location search error:', error)
      results.value = []
    } finally {
      searching.value = false
    }
  }, 500) // Debounce for 500ms
}

function selectLocation(location) {
  searchQuery.value = location.display_name
  emit('update:modelValue', location.display_name)
  emit('location-selected', {
    address: location.display_name,
    latitude: parseFloat(location.lat),
    longitude: parseFloat(location.lon)
  })
  showResults.value = false
  results.value = []
}

// Close dropdown when clicking outside
if (typeof window !== 'undefined') {
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.location-search')) {
      showResults.value = false
    }
  })
}
</script>

<style scoped>
.location-search {
  position: relative;
  width: 100%;
}

.search-input {
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

.search-input::placeholder {
  color: var(--color-text-muted);
}

.search-input:focus {
  outline: none;
  border-color: var(--accent-500);
  box-shadow: 0 0 0 4px hsl(180, 80%, 92%);
}

.results-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  margin-top: 0.5rem;
  background: white;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  max-height: 300px;
  overflow-y: auto;
  z-index: 1000;
}

.result-item {
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: background var(--transition-base);
  border-bottom: 1px solid var(--color-border);
}

.result-item:last-child {
  border-bottom: none;
}

.result-item:hover {
  background: hsl(180, 80%, 95%);
}

.result-name {
  font-size: 0.9rem;
  color: var(--color-heading);
}

.loading {
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  text-align: center;
}
</style>
