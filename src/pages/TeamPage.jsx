import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const ROLES = ['salesperson','manager','accounting','vendor']
const roleColors = { manager:'var(--accent)', salesperson:'var(--blue)', accounting:'var(--green)', vendor:'var(--purple)' }

export default function TeamPage() {
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newUser, setNewUser] = useState({ full_name:'', email:'', password:'', role:'salesperson', vendor_name:'' })

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('profiles').select('*').order('role').order('full_name')
    setTeam(data || [])
    setLoading(false)
  }

  async function createUser() {
    if (!newUser.full_name || !newUser.email || !newUser.password) return toast.error('Name, email, and password are required')
    setCreating(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: newUser.email,
        password: newUser.password,
        email_confirm: true
      })
      if (authError) throw authError

      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        full_name: newUser.full_name,
        email: newUser.email,
        role: newUser.role,
        vendor_name: newUser.vendor_name || null
      })
      if (profileError) throw profileError

      toast.success(`${newUser.full_name} added successfully`)
      setShowNew(false)
      setNewUser({ full_name:'', email:'', password:'', role:'salesperson', vendor_name:'' })
      load()
    } catch (err) {
      toast.error(err.message)
    }
    setCreating(false)
  }

  const byRole = ROLES.reduce((acc, r) => {
    acc[r] = team.filter(u => u.role === r)
    return acc
  }, {})

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Team &amp; vendors</div>
          <div className="page-sub">Manage portal access and roles</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(!showNew)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M12 5v14M5 12h14"/></svg>
          Add user
        </button>
      </div>
      <div className="page-body" style={{ maxWidth:740 }}>

        {showNew && (
          <div className="card" style={{ marginBottom:16,borderColor:'rgba(232,184,75,0.3)' }}>
            <div className="card-title">Add new user</div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Full name *</label>
                <input className="form-input" value={newUser.full_name} onChange={e => setNewUser(u=>({...u,full_name:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" value={newUser.email} onChange={e => setNewUser(u=>({...u,email:e.target.value}))} />
              </div>
              <div className="form-group">
                <label className="form-label">Temporary password *</label>
                <input className="form-input" type="password" value={newUser.password} onChange={e => setNewUser(u=>({...u,password:e.target.value}))} placeholder="They can change it after login" />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={newUser.role} onChange={e => setNewUser(u=>({...u,role:e.target.value}))}>
                  {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                </select>
              </div>
              {newUser.role === 'vendor' && (
                <div className="form-group span-2">
                  <label className="form-label">Vendor / company name</label>
                  <input className="form-input" value={newUser.vendor_name} onChange={e => setNewUser(u=>({...u,vendor_name:e.target.value}))} placeholder="e.g. Speedy Glass, AA Tint Shop" />
                </div>
              )}
            </div>
            <div className="row" style={{ marginTop:12 }}>
              <button className="btn btn-primary" onClick={createUser} disabled={creating}>{creating ? 'Creating...' : 'Create user'}</button>
              <button className="btn" onClick={() => setShowNew(false)}>Cancel</button>
            </div>
            <div style={{ marginTop:12,padding:'10px 12px',background:'var(--bg)',borderRadius:6,fontSize:12,color:'var(--text-3)' }}>
              Note: Requires Supabase service role key configured on your server. For easier setup, create users directly in your Supabase dashboard under Authentication → Users, then add their profile here.
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ color:'var(--text-3)',fontSize:13 }}>Loading...</div>
        ) : (
          ROLES.map(role => byRole[role].length > 0 && (
            <div key={role} className="card" style={{ marginBottom:12 }}>
              <div className="card-title" style={{ color: roleColors[role] }}>{role.charAt(0).toUpperCase()+role.slice(1)}s ({byRole[role].length})</div>
              <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                {byRole[role].map(user => (
                  <div key={user.id} style={{ display:'flex',alignItems:'center',gap:12,padding:'8px 0',borderBottom:'1px solid var(--border)' }}>
                    <div style={{
                      width:32,height:32,borderRadius:'50%',background:`rgba(${roleColors[role]},0.1)`,
                      border:`1px solid ${roleColors[role]}`,display:'flex',alignItems:'center',
                      justifyContent:'center',fontSize:12,fontWeight:600,color:roleColors[role],flexShrink:0,
                      background: role==='manager' ? 'var(--accent-dim)' : role==='salesperson' ? 'var(--blue-dim)' : role==='accounting' ? 'var(--green-dim)' : 'var(--purple-dim)'
                    }}>
                      {user.full_name.split(' ').map(n=>n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:14,fontWeight:500 }}>{user.full_name}</div>
                      <div style={{ fontSize:12,color:'var(--text-3)' }}>{user.email}{user.vendor_name ? ` · ${user.vendor_name}` : ''}</div>
                    </div>
                    <span style={{ fontSize:11,fontWeight:600,padding:'3px 8px',borderRadius:12,
                      background: role==='manager' ? 'var(--accent-dim)' : role==='salesperson' ? 'var(--blue-dim)' : role==='accounting' ? 'var(--green-dim)' : 'var(--purple-dim)',
                      color: roleColors[role] }}>{role}</span>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </>
  )
}
