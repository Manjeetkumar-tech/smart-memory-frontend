const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  if (!envUrl) return 'http://localhost:8080/api/auth'
  let base = envUrl.replace(/\/items\/?$/, '')
  if (!base.endsWith('/api')) {
    base = base.replace(/\/$/, '')
    if (!base.endsWith('/api')) {
      base += '/api'
    }
  }
  return `${base}/auth`
}

const BASE_URL = getBaseUrl()

export async function registerUser(userData) {
  const res = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  })
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.detail || 'Registration failed')
  }
  const data = await res.json()
  if (data.token) {
    localStorage.setItem('jwt_token', data.token)
    localStorage.setItem('user_info', JSON.stringify(data))
  }
  return data
}

export async function loginUser(credentials) {
  const res = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials),
  })
  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(errorData.detail || 'Login failed')
  }
  const data = await res.json()
  if (data.token) {
    localStorage.setItem('jwt_token', data.token)
    localStorage.setItem('user_info', JSON.stringify(data))
  }
  return data
}

export function logoutUser() {
  localStorage.removeItem('jwt_token')
  localStorage.removeItem('user_info')
}

export function getStoredUser() {
  const userJson = localStorage.getItem('user_info')
  return userJson ? JSON.parse(userJson) : null
}
