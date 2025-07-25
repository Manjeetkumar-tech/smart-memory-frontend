<template>
  <div class="max-w-md mx-auto p-4 border rounded shadow">
    <h2 class="text-xl font-bold mb-4">{{ isRegister ? 'Register' : 'Login' }}</h2>

    <form @submit.prevent="submitForm">
      <div class="mb-4">
        <label for="email" class="block mb-1">Email</label>
        <input
          id="email"
          type="email"
          v-model="email"
          required
          class="w-full border rounded px-3 py-2"
        />
      </div>

      <div class="mb-4">
        <label for="password" class="block mb-1">Password</label>
        <input
          id="password"
          type="password"
          v-model="password"
          required
          class="w-full border rounded px-3 py-2"
        />
      </div>

      <button type="submit" class="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
        {{ isRegister ? 'Register' : 'Login' }}
      </button>
    </form>

    <p class="mt-4 text-center">
      <button @click="toggleMode" class="text-blue-600 underline">
        {{ isRegister ? 'Already have an account? Login' : "Don't have an account? Register" }}
      </button>
    </p>

    <p v-if="errorMessage" class="mt-2 text-red-600 text-center">{{ errorMessage }}</p>
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
/* Add any styling you want here */
</style>
