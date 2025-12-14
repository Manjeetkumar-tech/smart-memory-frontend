import { createRouter, createWebHistory } from 'vue-router'
import Login from '../pages/Login.vue'
import Register from '../pages/Register.vue'
import Dashboard from '../pages/Dashboard.vue'
import ForgotPassword from '../pages/ForgotPassword.vue'
import { useUserStore } from '@/stores/userStore'

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'Login', component: Login },
  { path: '/register', name: 'Register', component: Register },
  { 
    path: '/dashboard', 
    name: 'Dashboard', 
    component: Dashboard,
    meta: { requiresAuth: true }
  },
  { 
    path: '/post', 
    name: 'PostItem', 
    component: () => import('../pages/PostItem.vue'),
    meta: { requiresAuth: true }
  },
  { path: '/forgot-password', name: 'ForgotPassword', component: ForgotPassword }
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

// Navigation guard to protect routes
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  
  if (to.meta.requiresAuth && !userStore.user) {
    // Redirect to login if route requires auth and user is not logged in
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register' || to.path === '/forgot-password') && userStore.user) {
    // Redirect to dashboard if already logged in and trying to access auth pages
    next('/dashboard')
  } else {
    next()
  }
})

export default router
