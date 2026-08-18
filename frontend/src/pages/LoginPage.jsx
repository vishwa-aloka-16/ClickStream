import { useState } from 'react'
import { API_URL } from '../config/app'
import { Icon } from '../components/Icon'
import { trackEvent } from '../lib/tracking'

export function LoginPage({ go, mode = 'login' }) {
  const isRegister = mode === 'register'
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const submit = async (event) => {
    event.preventDefault(); setLoading(true); setMessage('')
    const body = Object.fromEntries(new FormData(event.currentTarget).entries())
    try {
      const response = await fetch(`${API_URL}/api/auth/${isRegister ? 'register' : 'login'}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.message || 'Something went wrong.')
      localStorage.setItem('vantage_user', JSON.stringify(data.user))
      if (!isRegister) {
        void trackEvent('user_login', { user_id: data.user.id, login_method: 'email_password' })
      }
      go('/search')
    } catch (error) { setMessage(error.message) } finally { setLoading(false) }
  }

  return (
    <main className="login-page">
      <div className="blob one" /><div className="blob two" /><div className="blob three" />
      <div className="login-wrap">
        <div className="login-intro"><div><Icon>{isRegister ? 'person_add' : 'security'}</Icon></div><h1>{isRegister ? 'Create your account' : 'Welcome back'}</h1><p>{isRegister ? 'Join Vantage and start shopping.' : 'Enter your credentials to access your account.'}</p></div>
        <section className="login-card">
          <form onSubmit={submit}>
            {isRegister && <label><span>Full name</span><div><Icon>person</Icon><input name="name" placeholder="Jane Doe" required /></div></label>}
            <label><span>Email address</span><div><Icon>mail</Icon><input type="email" name="email" placeholder="name@company.com" required /></div></label>
            <label><span>Password</span><div><Icon>lock</Icon><input type={show ? 'text' : 'password'} name="password" placeholder="••••••••" required /><button type="button" onClick={() => setShow(!show)}><Icon>{show ? 'visibility' : 'visibility_off'}</Icon></button></div></label>
            {message && <p className="form-message error">{message}</p>}
            <button className="primary-btn" disabled={loading}>{loading ? 'Please wait…' : <>{isRegister ? 'Create Account' : 'Sign In'} <Icon>arrow_forward</Icon></>}</button>
          </form>
        </section>
        <p className="signup">{isRegister ? 'Already have an account?' : 'New to Vantage?'} <button onClick={() => go(isRegister ? '/login' : '/register')}>{isRegister ? 'Sign in' : 'Create an account'}</button></p>
        {!isRegister && <p className="signup admin-signin-link">Administrator? <button onClick={() => go('/admin/login')}>Admin sign in</button></p>}
      </div>
    </main>
  )
}
