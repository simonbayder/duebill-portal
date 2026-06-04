import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'

function fmt(n) { return `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
function pct(a, b) { return b === 0 ? '—' : `${((a / b) * 100).toFixed(1)}%` }

export default function AccountingReport() {
  const [bills, setBills] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('this_month')
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => { load() }, [dateRange, customStart, customEnd, filterStatus])

  function getRange() {
    const now = new Date()
    if (dateRange === 'this_month') return { start: startOfMonth(now), end: endOfMonth(now) }
    if (dateRange === 'last_month') { const lm = subMonths(now,1); return { start: startOfMonth(lm), end: endOfMonth(lm) } }
    if (dateRange === 'last_3') return { start: startOfMonth(subMonths(now,2)), end: endOfMonth(now) }
    if (dateRange === 'ytd') return { start: new Date(now.getFullYear(),0,1), end: now }
    if (dateRange === 'custom' && customStart && customEnd) return { start: new Date(customStart), end: new Date(customEnd) }
    return { start: startOfMonth(now), end: endOfMonth(now) }
  }

  async function load() {
    const { start, end } = getRange()
    let q = supabase.from('due_bills').select('*')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false })
    if (filterStatus !== 'all') q = q.eq('status', filterStatus)

    const { data: billData } = await q
    if (!billData) { setLoading(false); return }
    setBills(billData)

    const ids = billData.map(b => b.id)
    if (ids.length === 0) { setItems([]); setLoading(false); return }

    const { data: itemData } = await supabase.from('due_bill_items').select('*').in('due_bill_id', ids)
    setItems(itemData || [])
    setLoading(false)
  }

  // Summary
  const totalSold = items.reduce((s, i) => s + Number(i.sold_price || 0), 0)
  const totalCost = items.reduce((s, i) => s + Number(i.cost_price || 0), 0)
  const totalMargin = totalSold - totalCost
  const totalTax = bills.reduce((s, b) => {
    const billItems = items.filter(i => i.due_bill_id === b.id && !i.is_internal)
    const taxable = billItems.reduce((ss, i) => ss + Number(i.sold_price || 0), 0)
    return s + taxable * Number(b.tax_rate || 0)
  }, 0)

  // By bucket
  const byBucket = items.reduce((acc, item) => {
    const k = item.bucket_name
    if (!acc[k]) acc[k] = { name: k, count: 0, cost: 0, sold: 0 }
    acc[k].count++
    acc[k].cost += Number(item.cost_price || 0)
    acc[k].sold += Number(item.sold_price || 0)
    return acc
  }, {})
  const bucketRows = Object.values(byBucket).sort((a, b) => b.sold - a.sold)

  // By salesperson
  const bySales = bills.reduce((acc, bill) => {
    const k = bill.salesperson_name || 'Unknown'
    if (!acc[k]) acc[k] = { name: k, count: 0, cost: 0, sold: 0 }
    acc[k].count++
    const billItems = items.filter(i => i.due_bill_id === bill.id)
    acc[k].cost += billItems.reduce((s, i) => s + Number(i.cost_price || 0), 0)
    acc[k].sold += billItems.reduce((s, i) => s + Number(i.sold_price || 0), 0)
    return acc
  }, {})
  const salesRows = Object.values(bySales).sort((a, b) => b.sold - a.sold)

  function handlePrint() {
    window.print()
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Accounting report</div>
          <div className="page-sub">Cost, sold price, margin, and tax breakdown</div>
        </div>
        <button className="btn" onClick={handlePrint}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/></svg>
          Export / print
        </button>
      </div>
      <div className="page-body">

        {/* Filters */}
        <div className="card" style={{ marginBottom:20 }}>
          <div style={{ display:'flex',gap:12,flexWrap:'wrap',alignItems:'flex-end' }}>
            <div className="form-group" style={{ minWidth:160 }}>
              <label className="form-label">Date range</label>
              <select className="form-select" value={dateRange} onChange={e => setDateRange(e.target.value)}>
                <option value="this_month">This month</option>
                <option value="last_month">Last month</option>
                <option value="last_3">Last 3 months</option>
                <option value="ytd">Year to date</option>
                <option value="custom">Custom range</option>
              </select>
            </div>
            {dateRange === 'custom' && (
              <>
                <div className="form-group">
                  <label className="form-label">From</label>
                  <input className="form-input" type="date" value={customStart} onChange={e => setCustomStart(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">To</label>
                  <input className="form-input" type="date" value={customEnd} onChange={e => setCustomEnd(e.target.value)} />
                </div>
              </>
            )}
            <div className="form-group" style={{ minWidth:160 }}>
              <label className="form-label">Status</label>
              <select className="form-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="all">All statuses</option>
                <option value="approved">Approved</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ color:'var(--text-3)',fontSize:13 }}>Loading...</div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="stats-grid" style={{ marginBottom:20 }}>
              <div className="stat-card" style={{ '--accent-color':'var(--blue)' }}>
                <div className="stat-num" style={{ fontSize:20 }}>{bills.length}</div>
                <div className="stat-lbl">Due bills</div>
              </div>
              <div className="stat-card" style={{ '--accent-color':'var(--accent)' }}>
                <div className="stat-num" style={{ fontSize:20 }}>{fmt(totalSold)}</div>
                <div className="stat-lbl">Total sold</div>
              </div>
              <div className="stat-card" style={{ '--accent-color':'var(--red)' }}>
                <div className="stat-num" style={{ fontSize:20 }}>{fmt(totalCost)}</div>
                <div className="stat-lbl">Total cost</div>
              </div>
              <div className="stat-card" style={{ '--accent-color': totalMargin >= 0 ? 'var(--green)':'var(--red)' }}>
                <div className="stat-num" style={{ fontSize:20,color: totalMargin>=0 ? 'var(--green)':'var(--red)' }}>{fmt(totalMargin)}</div>
                <div className="stat-lbl">Gross margin ({pct(totalMargin, totalSold)})</div>
              </div>
              <div className="stat-card" style={{ '--accent-color':'var(--purple)' }}>
                <div className="stat-num" style={{ fontSize:20 }}>{fmt(totalTax)}</div>
                <div className="stat-lbl">Tax collected</div>
              </div>
              <div className="stat-card" style={{ '--accent-color':'var(--teal,var(--blue))' }}>
                <div className="stat-num" style={{ fontSize:20 }}>{fmt(totalSold + totalTax)}</div>
                <div className="stat-lbl">Total w/ tax</div>
              </div>
            </div>

            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:16,marginBottom:20 }}>
              {/* By bucket */}
              <div className="card">
                <div className="card-title">By bucket / category</div>
                <table>
                  <thead><tr>
                    <th>Category</th><th style={{ textAlign:'right' }}>Items</th>
                    <th style={{ textAlign:'right' }}>Cost</th><th style={{ textAlign:'right' }}>Sold</th><th style={{ textAlign:'right' }}>Margin</th>
                  </tr></thead>
                  <tbody>
                    {bucketRows.map(row => (
                      <tr key={row.name}>
                        <td style={{ fontSize:12,fontWeight:600,color:'var(--accent)' }}>{row.name}</td>
                        <td style={{ textAlign:'right',fontSize:12,color:'var(--text-3)' }}>{row.count}</td>
                        <td style={{ textAlign:'right',fontSize:12,fontFamily:'var(--mono)' }}>{fmt(row.cost)}</td>
                        <td style={{ textAlign:'right',fontSize:12,fontFamily:'var(--mono)' }}>{fmt(row.sold)}</td>
                        <td style={{ textAlign:'right',fontSize:12,fontFamily:'var(--mono)',color:(row.sold-row.cost)>=0?'var(--green)':'var(--red)' }}>
                          {fmt(row.sold - row.cost)}
                        </td>
                      </tr>
                    ))}
                    {bucketRows.length === 0 && <tr><td colSpan={5} style={{ textAlign:'center',color:'var(--text-3)',padding:20 }}>No data</td></tr>}
                  </tbody>
                </table>
              </div>

              {/* By salesperson */}
              <div className="card">
                <div className="card-title">By salesperson</div>
                <table>
                  <thead><tr>
                    <th>Salesperson</th><th style={{ textAlign:'right' }}>Bills</th>
                    <th style={{ textAlign:'right' }}>Sold</th><th style={{ textAlign:'right' }}>Margin</th>
                  </tr></thead>
                  <tbody>
                    {salesRows.map(row => (
                      <tr key={row.name}>
                        <td style={{ fontSize:13,fontWeight:500 }}>{row.name}</td>
                        <td style={{ textAlign:'right',fontSize:12,color:'var(--text-3)' }}>{row.count}</td>
                        <td style={{ textAlign:'right',fontSize:12,fontFamily:'var(--mono)' }}>{fmt(row.sold)}</td>
                        <td style={{ textAlign:'right',fontSize:12,fontFamily:'var(--mono)',color:(row.sold-row.cost)>=0?'var(--green)':'var(--red)' }}>
                          {fmt(row.sold - row.cost)}
                        </td>
                      </tr>
                    ))}
                    {salesRows.length === 0 && <tr><td colSpan={4} style={{ textAlign:'center',color:'var(--text-3)',padding:20 }}>No data</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Full bill detail table */}
            <div className="card">
              <div className="card-title">All due bills in range ({bills.length})</div>
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th>Bill #</th><th>Customer</th><th>Vehicle</th><th>Salesperson</th>
                    <th style={{ textAlign:'right' }}>Cost</th>
                    <th style={{ textAlign:'right' }}>Sold</th>
                    <th style={{ textAlign:'right' }}>Tax</th>
                    <th style={{ textAlign:'right' }}>Margin</th>
                    <th>Status</th><th>Date</th>
                  </tr></thead>
                  <tbody>
                    {bills.map(b => {
                      const billItems = items.filter(i => i.due_bill_id === b.id)
                      const sold = billItems.reduce((s, i) => s + Number(i.sold_price||0), 0)
                      const cost = billItems.reduce((s, i) => s + Number(i.cost_price||0), 0)
                      const taxable = billItems.filter(i => !i.is_internal).reduce((s, i) => s + Number(i.sold_price||0), 0)
                      const tax = taxable * Number(b.tax_rate||0)
                      const mg = sold - cost
                      return (
                        <tr key={b.id}>
                          <td><span className="mono">{b.bill_number}</span></td>
                          <td style={{ fontWeight:500,fontSize:13 }}>{b.customer_name}</td>
                          <td style={{ fontSize:12,color:'var(--text-2)' }}>{[b.vehicle_year,b.vehicle_make,b.vehicle_model].filter(Boolean).join(' ')}</td>
                          <td style={{ fontSize:12,color:'var(--text-2)' }}>{b.salesperson_name}</td>
                          <td style={{ textAlign:'right',fontSize:12,fontFamily:'var(--mono)',color:'var(--text-2)' }}>{fmt(cost)}</td>
                          <td style={{ textAlign:'right',fontSize:12,fontFamily:'var(--mono)' }}>{fmt(sold)}</td>
                          <td style={{ textAlign:'right',fontSize:12,fontFamily:'var(--mono)',color:'var(--text-3)' }}>{fmt(tax)}</td>
                          <td style={{ textAlign:'right',fontSize:12,fontFamily:'var(--mono)',color: mg>=0?'var(--green)':'var(--red)',fontWeight:500 }}>{fmt(mg)}</td>
                          <td><span className={`badge badge-${b.status}`}>{b.status.replace(/_/g,' ')}</span></td>
                          <td style={{ fontSize:11,color:'var(--text-3)' }}>{format(new Date(b.created_at),'MMM d')}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  )
}
