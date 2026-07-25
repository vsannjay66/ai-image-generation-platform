import React, { useState } from 'react'
import { api } from '../api.js'

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function submit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const fn = mode === 'login' ? api.login : api.register
      const { access_token } = await fn(email, password)
      onAuth(access_token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-wrap">
      <form className="auth-card" onSubmit={submit}>
        <div className="logo">🎨</div>
        <h1>AI Image Studio</h1>
        <p className="muted">{mode === 'login' ? 'Welcome back' : 'Create your account'}</p>

        <input type="email" placeholder="Email" autoComplete="email"
          value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Password (min 6 chars)" autoComplete="current-password"
          value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />

        {error && <div className="error">{error}</div>}

        <button className="primary" disabled={loading}>
          {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Sign up'}
        </button>

        <p className="switch">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <a onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}>
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </a>
        </p>
      </form>
    </div>
  )
}
