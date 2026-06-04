import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

const STATUSES = ['', 'draft', 'pending_approval', 'approved', 'rejected', 'in_progress', 'completed', 'closed']

export default function BillsList() {
  const navigate = useNavigate()
  const [bills, setBills] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('due_bills').select('*').order('created_at', { ascending: false })
    setBills(data || [])
    setLoading(false)
  }

  const filtered = bills.filter(b => {
    const matchSearch = !search || [b.customer_name, b.bill_number, b.vehicle_vin, b.vehicle_make, b.vehicle_model]
      .some(v => v?.toLowerCase().includes(search.toLowerCase()))
    const matchStatus = !filterStatus || b.status === filterStatus
    return matchSearch && matchStatus
  })

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">All due bills</div>
          <div className="page-sub">{bills.length} total records</div>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/bills/new')}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M12 5v14M5 12h14"/></svg>
          New due bill
        </button>
      </div>
      <div className="page-body">
        <div className="row" style={{ marginBottom:16 }}>
          <input className="form-input" style={{ maxWidth:280 }} placeholder="Search customer, VIN, bill #..." value={search} onChange={e => setSearch(e.target.value)} />
          <select className="form-select" style={{ width:'auto' }} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{s || 'All statuses'}</option>)}
          </select>
        </div>
        <div className="card">
          {loading ? (
            <div style={{ padding:'20px 0',color:'var(--text-3)',fontSize:13 }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="empty-state"><p>No due bills found</p></div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr>
                  <th>Bill #</th><th>Customer</th><th>Vehicle</th><th>Items</th><th>Status</th><th>Salesperson</th><th>Date</th>
                </tr></thead>
                <tbody>
                  {filtered.map(b => (
                    <tr key={b.id} style={{ cursor:'pointer' }} onClick={() => navigate(`/bills/${b.id}`)}>
                      <td><span className="mono">{b.bill_number}</span></td>
                      <td style={{ fontWeight:500 }}>{b.customer_name}</td>
                      <td style={{ color:'var(--text-2)',fontSize:13 }}>{[b.vehicle_year,b.vehicle_make,b.vehicle_model].filter(Boolean).join(' ') || '—'}</td>
                      <td style={{ color:'var(--text-3)',fontSize:12 }}>—</td>
                      <td><span className={`badge badge-${b.status}`}>{b.status.replace('_',' ')}</span></td>
                      <td style={{ color:'var(--text-2)',fontSize:13 }}>{b.salesperson_name}</td>
                      <td style={{ color:'var(--text-3)',fontSize:12 }}>{format(new Date(b.created_at),'MMM d, yyyy')}</td>
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
