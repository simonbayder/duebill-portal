import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) toast.error(error.message)
    setLoading(false)
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-mark" style={{ width:40,height:40,fontSize:16 }}>DB</div>
          <div>
            <div style={{ fontSize:18,fontWeight:600,letterSpacing:'-0.02em' }}>Due Bill Portal</div>
            <div style={{ fontSize:12,color:'var(--text-3)',marginTop:2 }}>Dealership management</div>
          </div>
        </div>
        <div className="login-title">Sign in</div>
        <div className="login-sub">Enter your credentials to access the portal</div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input className="form-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@company.com" required autoFocus />
          </div>
          <div className="form-group" style={{ marginTop:14 }}>
            <label className="form-label">Password</label>
            <input className="form-input" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading} style={{ width:'100%',marginTop:24,justifyContent:'center',padding:'11px 16px' }}>
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
        <p style={{ fontSize:12,color:'var(--text-3)',marginTop:20,textAlign:'center' }}>
          Contact your manager to get access
        </p>
      </div>
    </div>
  )
}
