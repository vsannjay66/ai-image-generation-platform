import React, { useState, useEffect } from 'react'
import { api } from '../api.js'
import ImageCard from './ImageCard.jsx'

export default function Chat({ session }) {
  const [prompt, setPrompt] = useState('')
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingList, setLoadingList] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let alive = true
    setLoadingList(true)
    api.sessionHistory(session.id)
      .then((data) => { if (alive) setImages(data) })
      .catch((e) => { if (alive) setError(e.message) })
      .finally(() => { if (alive) setLoadingList(false) })
    return () => { alive = false }
  }, [session.id])

  async function generate(e) {
    e.preventDefault()
    if (!prompt.trim()) return
    setLoading(true)
    setError('')
    try {
      const img = await api.generateImage(session.id, prompt.trim())
      setImages((prev) => [img, ...prev])
      setPrompt('')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="chat">
      <header className="chat-head"><h2>{session.title}</h2></header>

      <form className="prompt-bar" onSubmit={generate}>
        <input
          placeholder="Describe an image… e.g. a cat astronaut floating over the moon"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          disabled={loading}
        />
        <button className="primary" disabled={loading || !prompt.trim()}>
          {loading ? 'Generating…' : '✨ Generate'}
        </button>
      </form>

      {error && <div className="error">{error}</div>}

      <div className="gallery">
        {loading && (
          <div className="card skeleton-card">
            <div className="skeleton-img" />
            <div className="skeleton-line" />
          </div>
        )}
        {!loadingList && images.length === 0 && !loading && (
          <div className="muted empty-hint">No images yet — type a prompt above and hit Generate.</div>
        )}
        {images.map((img) => <ImageCard key={img.id} img={img} />)}
      </div>
    </div>
  )
}
