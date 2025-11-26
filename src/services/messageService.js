const BASE_URL = 'http://localhost:8080/api/messages'

export async function sendMessage(itemId, senderId, receiverId, content) {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      itemId,
      senderId,
      receiverId,
      content
    })
  })
  return response.json()
}

export async function getItemMessages(itemId) {
  const response = await fetch(`${BASE_URL}/item/${itemId}`)
  return response.json()
}

export async function getUserMessages(userId) {
  const response = await fetch(`${BASE_URL}/user/${userId}`)
  return response.json()
}

export async function getUnreadMessages(userId) {
  const response = await fetch(`${BASE_URL}/user/${userId}/unread`)
  return response.json()
}

export async function markAsRead(messageId) {
  const response = await fetch(`${BASE_URL}/${messageId}/read`, {
    method: 'PUT'
  })
  return response.json()
}
