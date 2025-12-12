const BASE_URL = 'http://localhost:8080/api/items'

export async function fetchItems(search = '') {
  const url = search
    ? `${BASE_URL}?search=${encodeURIComponent(search)}`
    : BASE_URL
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
  return fetch(`${BASE_URL}/${id}`, { method: 'DELETE' })
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
