// src/firebase.js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: 'AIzaSyDhto09qQn7eZPTPHVArCG263DPWfBKBzc',
  authDomain: 'smartmemorylogs.firebaseapp.com',
  projectId: 'smartmemorylogs',
  storageBucket: 'smartmemorylogs.firebasestorage.app',
  messagingSenderId: '137522223809',
  appId: '1:137522223809:web:54465114ca265079759240',
  measurementId: 'G-VRT0RVR132',
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const storage = getStorage(app)
