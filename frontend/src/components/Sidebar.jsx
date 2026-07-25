import React, { useState } from 'react'

export default function Sidebar({
  sessions, activeId, view, onSelect, onCreate, onRename, onDelete, onHistory, onLogout,
}) {
  const [newTitle, setNewTitle] = useState('')
  const [busy, setBusy] = useState(false)

  async function create() {
    const title = newTitle.trim() || 'New chat'
    setBusy(true)
    try {
      setNewTitle('')
      await onCreate(title)
    } finally {
      setBusy(false)
    }
  }

  return (
    <aside className="sidebar">
      <div className="brand">🎨 AI Studio</div>

      <div className="new-chat">
        <input
          placeholder="New session title"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && create()}
        />
        <button onClick={create} disabled={busy}>+ New</button>
      </div>

      <nav className="sessions">
        {sessions.length === 0 && <div className="muted small">No sessions yet</div>}
        {sessions.map((s) => (
          <div key={s.id} className={'session' + (view === 'chat' && s.id === activeId ? ' active' : '')}>
            <span className="title" onClick={() => onSelect(s.id)} title={s.title}>{s.title}</span>
            <span className="actions">
              <button title="Rename" onClick={async () => {
                const t = prompt('Rename session', s.title)
                if (t && t.trim()) await onRename(s.id, t.trim())
              }}>✎</button>
              <button title="Delete" onClick={async () => {
                if (confirm(`Delete "${s.title}"?`)) await onDelete(s.id)
              }}>🗑</button>
            </span>
          </div>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className={'ghost' + (view === 'history' ? ' active' : '')} onClick={onHistory}>🕘 All history</button>
        <button className="ghost" onClick={onLogout}>↩ Log out</button>
      </div>
    </aside>
  )
}
