import React, { useState } from 'react'

async function downloadImage(url, name) {
  try {
    const res = await fetch(url)
    const blob = await res.blob()
    const objectUrl = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = objectUrl
    a.download = name
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(objectUrl)
  } catch {
    // Cross-origin fetch may be blocked — fall back to opening in a new tab.
    window.open(url, '_blank')
  }
}

export default function ImageCard({ img }) {
  const [downloading, setDownloading] = useState(false)

  async function handleDownload() {
    setDownloading(true)
    try {
      await downloadImage(img.image_url, `ai-image-${img.id}.jpg`)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <figure className="card">
      <a href={img.image_url} target="_blank" rel="noreferrer">
        <img src={img.image_url} alt={img.prompt} loading="lazy" />
      </a>
      <figcaption>
        <p className="prompt" title={img.prompt}>{img.prompt}</p>
        <div className="card-foot">
          <time>{new Date(img.created_at).toLocaleString()}</time>
          <button className="download" onClick={handleDownload} disabled={downloading}>
            {downloading ? '…' : '⬇ Download'}
          </button>
        </div>
      </figcaption>
    </figure>
  )
}
