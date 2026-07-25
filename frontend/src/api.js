const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function getToken() {
  return localStorage.getItem('token')
}
export function setToken(t) {
  localStorage.setItem('token', t)
}
export function clearToken() {
  localStorage.removeItem('token')
}

async function request(path, { method = 'GET', body, auth = true } = {}) {
  const headers = { 'Content-Type': 'application/json' }
  if (auth && getToken()) headers['Authorization'] = `Bearer ${getToken()}`

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    let detail = res.statusText
    try {
      const data = await res.json()
      detail = data.detail || detail
    } catch { /* non-JSON error body */ }
    const err = new Error(typeof detail === 'string' ? detail : JSON.stringify(detail))
    err.status = res.status
    throw err
  }
  if (res.status === 204) return null
  return res.json()
}

export const api = {
  register: (email, password) =>
    request('/auth/register', { method: 'POST', auth: false, body: { email, password } }),
  login: (email, password) =>
    request('/auth/login', { method: 'POST', auth: false, body: { email, password } }),

  listSessions: () => request('/chat_sessions'),
  createSession: (title) =>
    request('/chat_sessions/create', { method: 'POST', body: { title } }),
  renameSession: (id, title) =>
    request(`/chat_sessions/${id}/rename`, { method: 'PUT', body: { title } }),
  deleteSession: (id) =>
    request(`/chat_sessions/${id}`, { method: 'DELETE' }),

  generateImage: (session_id, prompt) =>
    request('/chat_sessions/generate_image', { method: 'POST', body: { session_id, prompt } }),
  sessionHistory: (id) => request(`/chat_sessions/history/${id}`),
  allHistory: () => request('/history'),
}
