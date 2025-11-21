<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-card">
        <h1 class="auth-title">Reset Password 🔑</h1>
        <p class="auth-subtitle">Enter your email to receive a password reset link</p>

        <form v-if="!emailSent" @submit.prevent="handleForgotPassword" class="auth-form">
          <div class="form-group">
            <label for="email" class="form-label">Email</label>
            <input
              id="email"
              type="email"
              v-model="email"
              required
              class="form-input"
              placeholder="you@example.com"
              autocomplete="email"
            />
          </div>

          <button type="submit" class="submit-btn" :disabled="loading">
            {{ loading ? 'Sending...' : 'Send Reset Link' }}
          </button>
        </form>

        <div v-else class="success-container">
          <div class="success-icon">✅</div>
          <p class="success-text">Password reset email sent!</p>
          <p class="success-subtext">Check your inbox for the reset link.</p>
        </div>

        <p class="toggle-text">
          Remember your password?
          <router-link to="/login" class="toggle-link">Sign in</router-link>
        </p>

        <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { auth } from '@/firebase'
import { sendPasswordResetEmail } from 'firebase/auth'

const email = ref('')
const loading = ref(false)
const errorMessage = ref('')
const emailSent = ref(false)

async function handleForgotPassword() {
  errorMessage.value = ''
  loading.value = true

  try {
    await sendPasswordResetEmail(auth, email.value)
    emailSent.value = true
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      errorMessage.value = 'No account found with this email address.'
    } else if (error.code === 'auth/invalid-email') {
      errorMessage.value = 'Please enter a valid email address.'
    } else {
      errorMessage.value = error.message
    }
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.auth-container {
  width: 100%;
  max-width: 450px;
}

.auth-card {
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
  background: linear-gradient(135deg, hsl(45, 90%, 55%) 0%, hsl(30, 85%, 60%) 100%);
}

.auth-title {
  font-size: 1.875rem;
  font-weight: 700;
  color: var(--color-heading);
  margin-bottom: 0.5rem;
  text-align: center;
  background: linear-gradient(135deg, hsl(45, 90%, 55%) 0%, hsl(30, 85%, 60%) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.auth-subtitle {
  text-align: center;
  color: var(--color-text-muted);
  margin-bottom: 2rem;
  font-size: 0.95rem;
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
  border-color: hsl(45, 90%, 55%);
  box-shadow: 0 0 0 4px hsl(45, 90%, 92%);
}

.submit-btn {
  width: 100%;
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, hsl(45, 90%, 55%) 0%, hsl(30, 85%, 60%) 100%);
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

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg), 0 0 20px rgba(255, 200, 100, 0.3);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.success-container {
  text-align: center;
  padding: 2rem 0;
}

.success-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.success-text {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--success);
  margin-bottom: 0.5rem;
}

.success-subtext {
  color: var(--color-text-muted);
  font-size: 0.95rem;
}

.toggle-text {
  margin-top: 1.5rem;
  text-align: center;
  color: var(--color-text);
  font-size: 0.9rem;
}

.toggle-link {
  color: var(--primary-500);
  font-weight: 600;
  text-decoration: none;
  transition: color var(--transition-base);
}

.toggle-link:hover {
  color: var(--primary-600);
  text-decoration: underline;
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
