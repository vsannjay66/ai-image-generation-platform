import React, { useState, useEffect } from 'react'
import { api } from '../api.js'
import ImageCard from './ImageCard.jsx'

export default function History() {
  const [images, setImages] = useState([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    api.allHistory()
      .then(setImages)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = images.filter((i) => i.prompt.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="chat">
      <header className="chat-head"><h2>🕘 All history</h2></header>

      <div className="prompt-bar">
        <input placeholder="Search your prompts…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {error && <div className="error">{error}</div>}

      <div className="gallery">
        {loading && <div className="muted">Loading…</div>}
        {!loading && filtered.length === 0 && <div className="muted empty-hint">No images found.</div>}
        {filtered.map((img) => <ImageCard key={img.id} img={img} />)}
      </div>
    </div>
  )
}
