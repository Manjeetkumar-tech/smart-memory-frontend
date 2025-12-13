const getBaseUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL
    if (!envUrl) return 'http://localhost:8080/api/logs'
    
    let base = envUrl.replace(/\/items\/?$/, '')
    if (!base.endsWith('/api')) {
      base = base.replace(/\/$/, '')
      if (!base.endsWith('/api')) {
        base += '/api'
      }
    }
    return `${base}/logs`
  }
  
  const BASE_URL = getBaseUrl()

export async function fetchLogs(userId) {
  const res = await fetch(`${BASE_URL}?userId=${userId}`)
  return res.json()
}

export async function deleteLog(id) {
  return fetch(`${BASE_URL}/${id}`, { method: 'DELETE' })
}

export async function updateLog(id, content, mood, category) {
  console.log('updateLog payload:', { id, content, mood, category })
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, content, mood, category }),
  })

  if (!res.ok) {
    const errorData = await res.json()
    throw new Error(`Failed to update log: ${errorData.message || res.statusText}`)
  }

  return res.json()
}

export async function createLog(content, userId, mood, category) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, userId, mood, category }),
  })
  return res.json()
}
