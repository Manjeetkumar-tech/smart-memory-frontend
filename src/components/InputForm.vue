<template>
  <form @submit.prevent="submitLog" class="input-form">
    <div class="form-header">
      <h3 class="form-title">✍️ Add New Memory</h3>
    </div>
    <textarea
      v-model="logText"
      placeholder="What did you do today?"
      rows="4"
      class="form-textarea"
    ></textarea>
    <div class="form-row">
      <input
        v-model="mood"
        type="text"
        placeholder="Mood (e.g. happy, sad)"
        class="form-input"
      />
      <input
        v-model="category"
        type="text"
        placeholder="Category (e.g. work, personal)"
        class="form-input"
      />
    </div>
    <button type="submit" class="submit-btn">
      <span class="btn-icon">💾</span>
      Save Log
    </button>
  </form>
</template>

<script setup>
import { ref } from 'vue'

const emit = defineEmits(['submit-log'])
const logText = ref('')
const mood = ref('')
const category = ref('')

function submitLog() {
  if (!logText.value.trim()) return
  emit('submit-log', {
    content: logText.value,
    mood: mood.value,
    category: category.value,
  })
  logText.value = ''
  mood.value = ''
  category.value = ''
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
  margin-bottom: 1.25rem;
}

.form-input {
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

.form-input:focus {
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
