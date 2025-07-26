const BASE_URL = 'http://localhost:8080/api/logs'

export async function fetchLogs(userId) {
  const res = await fetch(`${BASE_URL}?userId=${userId}`)
  return res.json()
}

export async function deleteLog(id) {
  return fetch(`${BASE_URL}/${id}`, { method: 'DELETE' })
}

export async function updateLog(id, content, userId, timestamp, mood, category) {
  console.log('updateLog called with:', { id, content, userId, timestamp, mood, category })
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, content, userId, timestamp, mood, category }),
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
