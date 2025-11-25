<template>
  <div :id="mapId" class="map-container"></div>
</template>

<script setup>
import { onMounted, onUnmounted, ref, watch } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const props = defineProps({
  latitude: {
    type: Number,
    required: true
  },
  longitude: {
    type: Number,
    required: true
  },
  markerTitle: {
    type: String,
    default: 'Location'
  },
  height: {
    type: String,
    default: '200px'
  }
})

const mapId = `map-${Math.random().toString(36).substr(2, 9)}`
let map = null
let marker = null

onMounted(() => {
  // Initialize map
  map = L.map(mapId).setView([props.latitude, props.longitude], 13)
  
  // Add OpenStreetMap tiles
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19
  }).addTo(map)
  
  // Add marker
  marker = L.marker([props.latitude, props.longitude])
    .addTo(map)
    .bindPopup(props.markerTitle)
})

// Watch for coordinate changes
watch(() => [props.latitude, props.longitude], ([newLat, newLng]) => {
  if (map && marker) {
    const newLatLng = L.latLng(newLat, newLng)
    marker.setLatLng(newLatLng)
    map.setView(newLatLng, 13)
  }
})

onUnmounted(() => {
  if (map) {
    map.remove()
  }
})
</script>

<style scoped>
.map-container {
  height: v-bind(height);
  width: 100%;
  border-radius: var(--radius-md);
  overflow: hidden;
  border: 1px solid var(--color-border);
}
</style>
