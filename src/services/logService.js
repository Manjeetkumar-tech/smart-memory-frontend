const API_URL = 'http://localhost:8080/api/logs'

export async function fetchLogs() {
  const res = await fetch(API_URL)
  return res.json()
}

export async function createLog(content, userId) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, userId }),
  })
  return res.json()
}
