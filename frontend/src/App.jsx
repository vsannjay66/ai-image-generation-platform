import React, { useState, useEffect, useCallback } from 'react'
import { api, getToken, setToken as saveToken, clearToken } from './api.js'
import Auth from './components/Auth.jsx'
import Sidebar from './components/Sidebar.jsx'
import Chat from './components/Chat.jsx'
import History from './components/History.jsx'

export default function App() {
  const [token, setTokenState] = useState(getToken())
  const [sessions, setSessions] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [view, setView] = useState('chat') // 'chat' | 'history'
  const [menuOpen, setMenuOpen] = useState(false)
  const [error, setError] = useState('')

  const logout = useCallback(() => {
    clearToken()
    setTokenState(null)
    setSessions([])
    setActiveId(null)
  }, [])

  const loadSessions = useCallback(async () => {
    try {
      const data = await api.listSessions()
      setSessions(data)
      setActiveId((cur) => (cur == null && data.length ? data[0].id : cur))
    } catch (e) {
      if (e.status === 401) logout()
      else setError(e.message)
    }
  }, [logout])

  useEffect(() => {
    if (token) loadSessions()
  }, [token, loadSessions])

  if (!token) {
    return <Auth onAuth={(t) => { saveToken(t); setTokenState(t) }} />
  }

  const activeSession = sessions.find((s) => s.id === activeId) || null

  async function handleCreate(title) {
    const s = await api.createSession(title)
    await loadSessions()
    setActiveId(s.id)
    setView('chat')
    setMenuOpen(false)
  }
  async function handleRename(id, title) {
    await api.renameSession(id, title)
    await loadSessions()
  }
  async function handleDelete(id) {
    await api.deleteSession(id)
    const rest = sessions.filter((s) => s.id !== id)
    setSessions(rest)
    if (activeId === id) setActiveId(rest[0]?.id ?? null)
  }

  return (
    <div className={'layout' + (menuOpen ? ' menu-open' : '')}>
      <button className="hamburger" onClick={() => setMenuOpen((o) => !o)} aria-label="Menu">☰</button>

      <Sidebar
        sessions={sessions}
        activeId={activeId}
        view={view}
        onSelect={(id) => { setActiveId(id); setView('chat'); setMenuOpen(false) }}
        onCreate={handleCreate}
        onRename={handleRename}
        onDelete={handleDelete}
        onHistory={() => { setView('history'); setMenuOpen(false) }}
        onLogout={logout}
      />

      <main className="main" onClick={() => setMenuOpen(false)}>
        {error && <div className="error banner">{error}</div>}
        {view === 'history'
          ? <History />
          : activeSession
            ? <Chat session={activeSession} />
            : <div className="empty">Create a session on the left to start generating images.</div>}
      </main>
    </div>
  )
}
