const getBaseUrl = () => {
  const envUrl = import.meta.env.VITE_API_URL
  if (!envUrl) return 'http://localhost:8080/api/items'
  
  // If envUrl has '/items', strip it. If it doesn't end in '/api', append it.
  let base = envUrl.replace(/\/items\/?$/, '')
  if (!base.endsWith('/api')) {
    // If it ends in '/', remove it before checking or appending
    base = base.replace(/\/$/, '')
    if (!base.endsWith('/api')) {
      base += '/api'
    }
  }
  return `${base}/items`
}

const BASE_URL = getBaseUrl()

export async function fetchItems(options = {}) {
  const { 
    search = '', 
    page = 0, 
    size = 10,
    type = null,
    status = null,
    userId = null,
    excludeResolved = true
  } = options

  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    excludeResolved: excludeResolved.toString()
  })
  
  if (search) params.append('search', search)
  if (type) params.append('type', type)
  if (status) params.append('status', status)
  if (userId) params.append('userId', userId)

  const url = `${BASE_URL}?${params.toString()}`
  const res = await fetch(url)
  return res.json()
}

export async function createItem(itemData) {
  const res = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData),
  })
  return res.json()
}

export async function updateItem(id, itemData) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(itemData),
  })
  return res.json()
}

export async function deleteItem(id) {
  await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
  })
}

export async function resolveItem(id) {
  const res = await fetch(`${BASE_URL}/${id}/resolve`, {
    method: 'PUT',
  })
  return res.json()
}

export async function getItem(id) {
  const res = await fetch(`${BASE_URL}/${id}`)
  return res.json()
}

export async function claimItem(itemId, userId) {
  const res = await fetch(`${BASE_URL}/${itemId}/claim?userId=${userId}`, {
    method: 'PUT'
  })
  return res.json()
}

export async function unclaimItem(id) {
  const res = await fetch(`${BASE_URL}/${id}/unclaim`, {
    method: 'PUT',
  })
  return res.json()
}

export async function unresolveItem(id) {
  const res = await fetch(`${BASE_URL}/${id}/unresolve`, {
    method: 'PUT',
  })
  return res.json()
}
