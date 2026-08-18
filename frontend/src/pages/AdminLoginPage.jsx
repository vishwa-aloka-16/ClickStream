import { useState } from 'react'
import { Icon } from '../components/Icon'
import { API_URL } from '../config/app'

export function AdminLoginPage({ go }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (event) => {
    event.preventDefault()
    setLoading(true); setError('')
    const body = Object.fromEntries(new FormData(event.currentTarget).entries())
    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort(), 10000)
    try {
      const response = await fetch(`${API_URL}/api/admin/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: controller.signal })
      const data = await response.json().catch(() => ({ message: 'The admin server returned an invalid response.' }))
      if (!response.ok) throw new Error(data.message || 'Could not log in.')
      localStorage.setItem('vantage_admin', JSON.stringify(data.admin))
      go('/admin')
    } catch (requestError) {
      setError(requestError.name === 'AbortError' ? 'The admin server did not respond. Please try again.' : requestError.message)
    } finally {
      window.clearTimeout(timeout)
      setLoading(false)
    }
  }

  return <main className="login-page admin-login-page"><div className="login-wrap"><div className="login-intro"><div><Icon>admin_panel_settings</Icon></div><h1>Admin login</h1><p>Sign in to manage the Vantage product catalog.</p></div><section className="login-card"><form onSubmit={submit}><label><span>Admin email</span><div><Icon>mail</Icon><input type="email" name="email" defaultValue="admin@vantage.com" required /></div></label><label><span>Password</span><div><Icon>lock</Icon><input type="password" name="password" placeholder="Admin password" required /></div></label>{error && <p className="form-message error">{error}</p>}<button className="primary-btn" disabled={loading}>{loading ? 'Signing in…' : <>Admin Sign In <Icon>arrow_forward</Icon></>}</button></form></section><p className="signup"><button onClick={() => go('/search')}>Return to store</button></p></div></main>
}
