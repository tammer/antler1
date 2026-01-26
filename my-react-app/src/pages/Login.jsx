import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './Login.css'

function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const canSubmit = email.trim() && password

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit || isSubmitting) return

    setError('')
    setIsSubmitting(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password
      })

      if (signInError) throw signInError
      onLoginSuccess?.()
    } catch (err) {
      setError(err?.message || 'Login failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="login">
      <div className="login__card">
        <h1 className="login__title">Sign in</h1>

        <form className="login__form" onSubmit={onSubmit}>
          <label className="login__label" htmlFor="login-email">
            Email
          </label>
          <input
            id="login-email"
            className="login__input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@company.com"
          />

          <label className="login__label" htmlFor="login-password">
            Password
          </label>
          <input
            id="login-password"
            className="login__input"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
          />

          {error && <div className="login__error">{error}</div>}

          <button className="login__button" type="submit" disabled={!canSubmit || isSubmitting}>
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default Login

