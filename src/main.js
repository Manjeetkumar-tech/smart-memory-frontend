import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

import { onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'
import { useUserStore } from './stores/userStore'

const app = createApp(App)

const pinia = createPinia()
app.use(pinia)
app.use(router)

app.mount('#app')

// ✅ Persist Firebase user after page reload
onAuthStateChanged(auth, (user) => {
  const userStore = useUserStore()
  if (user) {
    userStore.setUser(user)
  } else {
    userStore.clearUser()
  }
})
