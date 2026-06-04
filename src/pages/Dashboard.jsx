import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status.replace('_', ' ')}</span>
}

export default function Dashboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, completed: 0 })
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)

  const isManager = ['manager','accounting'].includes(profile?.role)

  useEffect(() => {
    load()
  }, [profile])

  async function load() {
    setLoading(true)
    let query = supabase.from('due_bills').select('*').order('created_at', { ascending: false })
    if (profile?.role === 'salesperson') query = query.eq('salesperson_id', profile.id)

    const { data } = await query
    if (data) {
      setStats({
        total: data.length,
        pending: data.filter(b => b.status === 'pending_approval').length,
        approved: data.filter(b => ['approved','in_progress'].includes(b.status)).length,
        completed: data.filter(b => b.status === 'completed').length
      })
      setRecent(data.slice(0, 8))
    }
    setLoading(false)
  }

  async function handleDelete(e, billId) {
    e.stopPropagation()
    if (!window.confirm('Permanently delete this due bill? This cannot be undone.')) return
    await supabase.from('due_bill_items').delete().eq('due_bill_id', billId)
    await supabase.from('due_bill_images').delete().eq('due_bill_id', billId)
    await supabase.from('due_bill_signatures').delete().eq('due_bill_id', billId)
    const { error } = await supabase.from('due_bills').delete().eq('id', billId)
    if (error) return toast.error('Failed to delete: ' + error.message)
    toast.success('Due bill deleted')
    load()
  }

  const statCards = [
    { label: 'Total due bills', value: stats.total, color: 'var(--accent)' },
    { label: 'Pending approval', value: stats.pending, color: 'var(--accent)' },
    { label: 'Approved / active', value: stats.approved, color: 'var(--blue)' },
    { label: 'Completed', value: stats.completed, color: 'var(--green)' }
  ]

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">Welcome back, {profile?.full_name?.split(' ')[0]}</div>
        </div>
        {['manager','salesperson'].includes(profile?.role) && (
          <button className="btn btn-primary" onClick={() => navigate('/bills/new')}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M12 5v14M5 12h14"/></svg>
            New due bill
          </button>
        )}
      </div>
      <div className="page-body">
        <div className="stats-grid">
          {statCards.map(s => (
            <div key={s.label} className="stat-card" style={{ '--accent-color': s.color }}>
              <div className="stat-num">{loading ? '—' : s.value}</div>
              <div className="stat-lbl">{s.label}</div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="card-title">Recent due bills</div>
          {loading ? (
            <div style={{ padding:'20px 0',color:'var(--text-3)',fontSize:13 }}>Loading...</div>
          ) : recent.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📋</div>
              <p>No due bills yet. Create your first one.</p>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Bill #</th><th>Customer</th><th>Vehicle</th><th>Status</th><th>Salesperson</th><th>Date</th>
                  {isManager && <th></th>}
                </tr></thead>
                <tbody>
                  {recent.map(b => (
                    <tr key={b.id} style={{ cursor:'pointer' }} onClick={() => navigate(`/bills/${b.id}`)}>
                      <td><span className="mono">{b.bill_number}</span></td>
                      <td style={{ fontWeight:500 }}>{b.customer_name}</td>
                      <td style={{ color:'var(--text-2)' }}>{b.vehicle_year} {b.vehicle_make} {b.vehicle_model}</td>
                      <td><StatusBadge status={b.status} /></td>
                      <td style={{ color:'var(--text-2)' }}>{b.salesperson_name}</td>
                      <td style={{ color:'var(--text-3)',fontSize:12 }}>{b.created_at ? format(new Date(b.created_at), 'MMM d, yyyy') : '—'}</td>
                      {isManager && (
                        <td onClick={e => e.stopPropagation()}>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={e => handleDelete(e, b.id)}
                            style={{ fontSize:11,padding:'3px 8px' }}
                          >
                            Delete
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
