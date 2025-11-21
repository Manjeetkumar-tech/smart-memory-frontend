<template>
  <div class="auth-container">
    <div class="auth-card">
      <h2 class="auth-title">{{ isRegister ? 'Register' : 'Login' }}</h2>

      <form @submit.prevent="submitForm" class="auth-form">
        <div class="form-group">
          <label for="email" class="form-label">Email</label>
          <input
            id="email"
            type="email"
            v-model="email"
            required
            class="form-input"
            placeholder="you@example.com"
          />
        </div>

        <div class="form-group">
          <label for="password" class="form-label">Password</label>
          <input
            id="password"
            type="password"
            v-model="password"
            required
            class="form-input"
            placeholder="••••••••"
          />
        </div>

        <button type="submit" class="submit-btn">
          {{ isRegister ? 'Register' : 'Login' }}
        </button>
      </form>

      <p class="toggle-text">
        <button @click="toggleMode" class="toggle-btn">
          {{ isRegister ? 'Already have an account? Login' : "Don't have an account? Register" }}
        </button>
      </p>

      <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { auth } from '@/firebase'
import { useUserStore } from '@/stores/userStore'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth'

const email = ref('')
const password = ref('')
const isRegister = ref(false)
const errorMessage = ref('')
const userStore = useUserStore()

function toggleMode() {
  isRegister.value = !isRegister.value
  errorMessage.value = ''
}

async function submitForm() {
  errorMessage.value = ''
  try {
    if (isRegister.value) {
      await createUserWithEmailAndPassword(auth, email.value, password.value)
      alert('Registration successful! You can now login.')
      isRegister.value = false
      email.value = ''
      password.value = ''
    } else {
      const userCredential = await signInWithEmailAndPassword(auth, email.value, password.value)
      const user = userCredential.user

      userStore.setUser({
        uid: user.uid,
        email: user.email,
      })

      alert('Login successful!')
      // TODO: Handle login success (e.g., store user, redirect)
    }
  } catch (error) {
    errorMessage.value = error.message
  }
}
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 2rem 0;
}

.auth-card {
  width: 100%;
  max-width: 450px;
  padding: 2.5rem;
  background: var(--gradient-card);
  backdrop-filter: blur(10px);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-xl);
  border: 1px solid var(--color-border);
  position: relative;
  overflow: hidden;
}

.auth-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--gradient-primary);
}

.auth-title {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--color-heading);
  margin-bottom: 2rem;
  text-align: center;
  background: var(--gradient-primary);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
}

.form-input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-family: inherit;
  transition: all var(--transition-base);
  background: white;
  color: var(--color-heading);
}

.form-input::placeholder {
  color: var(--color-text-muted);
}

.form-input:focus {
  outline: none;
  border-color: var(--primary-400);
  box-shadow: 0 0 0 4px var(--primary-100);
}

.submit-btn {
  width: 100%;
  padding: 0.875rem 1.5rem;
  background: var(--gradient-primary);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-base);
  box-shadow: var(--shadow-md);
  margin-top: 0.5rem;
}

.submit-btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg), var(--shadow-glow);
}

.submit-btn:active {
  transform: translateY(0);
}

.toggle-text {
  margin-top: 1.5rem;
  text-align: center;
}

.toggle-btn {
  background: none;
  border: none;
  color: var(--primary-500);
  font-size: 0.9rem;
  cursor: pointer;
  text-decoration: underline;
  transition: color var(--transition-base);
  padding: 0;
}

.toggle-btn:hover {
  color: var(--primary-600);
}

.error-message {
  margin-top: 1rem;
  padding: 0.875rem;
  background: hsl(0, 84%, 95%);
  color: var(--error);
  border-radius: var(--radius-md);
  text-align: center;
  font-size: 0.9rem;
  border: 1px solid hsl(0, 84%, 85%);
}

@media (max-width: 640px) {
  .auth-card {
    padding: 2rem 1.5rem;
  }

  .auth-title {
    font-size: 1.5rem;
  }
}
</style>
