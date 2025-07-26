import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const storedUser = localStorage.getItem('user')
  const user = ref(storedUser ? JSON.parse(storedUser) : null)

  function setUser(userData) {
    user.value = userData
    localStorage.setItem('user', JSON.stringify(userData)) // ✅ Save to localStorage
  }

  function clearUser() {
    user.value = null
    localStorage.removeItem('user') // ✅ Clear localStorage
  }

  return { user, setUser, clearUser }
})
