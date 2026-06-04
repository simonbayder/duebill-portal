import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { sendVendorNotificationEmail } from '../lib/email'
import SignatureCapture from '../components/SignatureCapture'
import ImageUpload from '../components/ImageUpload'
import PrintableDueBill from '../components/PrintableDueBill'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

function StatusBadge({ status }) {
  return <span className={`badge badge-${status}`}>{status.replace(/_/g,' ')}</span>
}

export default function BillDetail() {
  const { id } = useParams()
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [bill, setBill] = useState(null)
  const [items, setItems] = useState([])
  const [images, setImages] = useState([])
  const [signature, setSignature] = useState(null)
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [rejectionReason, setRejectionReason] = useState('')
  const [showReject, setShowReject] = useState(false)
  const [showSignature, setShowSignature] = useState(false)
  const [showPrint, setShowPrint] = useState(false)
  const [activeTab, setActiveTab] = useState('details')

  const isManager = ['manager','accounting'].includes(profile?.role)
  const isVendor = profile?.role === 'vendor'
  const canSeeCost = isManager

  useEffect(() => { 
    if (id && id.length === 36) load()
    else setLoading(false)
  }, [id])

  async function load() {
    const [{ data: b }, { data: its }, { data: imgs }, { data: sig }, { data: cfg }] = await Promise.all([
      supabase.from('due_bills').select('*').eq('id', id).single(),
      supabase.from('due_bill_items').select('*').eq('due_bill_id', id),
      supabase.from('due_bill_images').select('*').eq('due_bill_id', id),
      supabase.from('due_bill_signatures').select('*').eq('due_bill_id', id).single(),
      supabase.from('settings').select('*').single()
    ])
    setBill(b)
    setItems(its || [])
    setImages(imgs || [])
    setSignature(sig || null)
    setSettings(cfg || {})
    setLoading(false)
  }

  async function updateStatus(status, extra = {}) {
    const { error } = await supabase.from('due_bills').update({
      status,
      ...extra,
      ...(status === 'approved' ? { approved_at: new Date().toISOString(), approved_by: profile.id } : {})
    }).eq('id', id)
    if (error) return toast.error(error.message)
    toast.success(`Due bill ${status.replace(/_/g,' ')}`)
    if (status === 'approved') await notifyVendors()
    load()
  }

  async function notifyVendors() {
    const vendorItems = items.filter(i => i.vendor_email)
    for (const item of vendorItems) {
      try {
        await sendVendorNotificationEmail({ dueBill: bill, item, vendorEmail: item.vendor_email, vendorName: item.vendor_name })
      } catch { }
    }
    if (vendorItems.length) toast.success(`${vendorItems.length} vendor${vendorItems.length > 1 ? 's' : ''} notified by email`)
  }

  async function handleReject() {
    if (!rejectionReason.trim()) return toast.error('Please provide a rejection reason')
    await updateStatus('rejected', { rejection_reason: rejectionReason })
    setShowReject(false)
  }

  async function updateItemStatus(itemId, status) {
    await supabase.from('due_bill_items').update({
      status,
      ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {})
    }).eq('id', itemId)
    load()
  }

  async function saveSignature({ dataUrl, signedName }) {
    const existing = signature
    if (existing) {
      await supabase.from('due_bill_signatures').update({
        signature_data_url: dataUrl,
        signed_by_name: signedName,
        signed_at: new Date().toISOString()
      }).eq('due_bill_id', id)
    } else {
      await supabase.from('due_bill_signatures').insert({
        due_bill_id: id,
        signature_data_url: dataUrl,
        signed_by_name: signedName
      })
    }
    toast.success('Signature saved')
    setShowSignature(false)
    load()
  }

  if (loading) return <div className="page-body" style={{ color:'var(--text-3)' }}>Loading...</div>
  if (!bill) return <div className="page-body" style={{ color:'var(--text-3)' }}>Not found</div>

  const subtotal = items.reduce((s, i) => s + Number(i.sold_price || 0), 0)
  const taxable = items.filter(i => !i.is_internal).reduce((s, i) => s + Number(i.sold_price || 0), 0)
  const tax = taxable * Number(bill.tax_rate || 0)
  const total = subtotal + tax
  const totalCost = items.reduce((s, i) => s + Number(i.cost_price || 0), 0)
  const margin = subtotal - totalCost

  const tabs = ['details', 'photos', 'print']
  if (isManager) tabs.splice(2, 0, 'signature')

  return (
    <>
      <div className="page-header">
        <div>
          <div className="row" style={{ gap:10,marginBottom:6 }}>
            <button className="btn btn-sm" onClick={() => navigate(-1)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              Back
            </button>
            <span className="mono" style={{ fontSize:14,color:'var(--text-2)' }}>{bill.bill_number}</span>
            <StatusBadge status={bill.status} />
            {signature && <span style={{ fontSize:11,padding:'2px 8px',background:'var(--green-dim)',color:'var(--green)',borderRadius:12,fontWeight:600 }}>✓ Signed</span>}
          </div>
          <div className="page-title">{bill.customer_name}</div>
          <div className="page-sub">{[bill.vehicle_year,bill.vehicle_make,bill.vehicle_model].filter(Boolean).join(' ')} · {bill.vehicle_vin || 'No VIN'}</div>
        </div>
        <div className="row">
          {isManager && bill.status === 'pending_approval' && (
            <>
              <button className="btn btn-success" onClick={() => updateStatus('approved')}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M20 6L9 17l-5-5"/></svg>
                Approve
              </button>
              <button className="btn btn-danger" onClick={() => setShowReject(!showReject)}>Reject</button>
            </>
          )}
          {isManager && bill.status === 'approved' && <button className="btn" onClick={() => updateStatus('in_progress')}>Mark in progress</button>}
          {isManager && bill.status === 'in_progress' && <button className="btn btn-success" onClick={() => updateStatus('completed')}>Mark completed</button>}
          {isManager && bill.status === 'completed' && <button className="btn" onClick={() => updateStatus('closed')}>Close bill</button>}
        </div>
      </div>

      <div className="page-body" style={{ maxWidth:960 }}>
        {bill.status === 'pending_approval' && isManager && (
          <div className="approval-banner">
            <div>
              <div style={{ fontWeight:600,fontSize:14 }}>Awaiting your approval</div>
              <div style={{ fontSize:12,color:'var(--text-2)',marginTop:2 }}>Submitted by {bill.salesperson_name} — approve to notify vendors automatically</div>
            </div>
          </div>
        )}
        {bill.status === 'rejected' && (
          <div style={{ background:'var(--red-dim)',border:'1px solid rgba(232,91,91,0.3)',borderRadius:'var(--radius)',padding:'12px 16px',marginBottom:16 }}>
            <div style={{ fontWeight:600,fontSize:13,color:'var(--red)' }}>Rejected</div>
            <div style={{ fontSize:13,marginTop:4,color:'var(--text-2)' }}>{bill.rejection_reason}</div>
          </div>
        )}
        {showReject && (
          <div className="card" style={{ marginBottom:16,borderColor:'rgba(232,91,91,0.3)' }}>
            <div className="form-group">
              <label className="form-label">Rejection reason</label>
              <textarea className="form-textarea" value={rejectionReason} onChange={e => setRejectionReason(e.target.value)} placeholder="Explain why..." />
            </div>
            <div className="row" style={{ marginTop:12 }}>
              <button className="btn btn-danger" onClick={handleReject}>Confirm rejection</button>
              <button className="btn" onClick={() => setShowReject(false)}>Cancel</button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:'flex',gap:4,borderBottom:'1px solid var(--border)',marginBottom:20 }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{
              padding:'8px 16px',fontSize:13,background:'none',border:'none',cursor:'pointer',
              color: activeTab===t ? 'var(--accent)' : 'var(--text-3)',
              borderBottom: activeTab===t ? '2px solid var(--accent)' : '2px solid transparent',
              fontFamily:'var(--font)',fontWeight: activeTab===t ? 500 : 400,marginBottom:-1,textTransform:'capitalize'
            }}>{t}</button>
          ))}
        </div>

        {/* DETAILS TAB */}
        {activeTab === 'details' && (
          <>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16 }}>
              <div className="card">
                <div className="card-title">Customer</div>
                <div style={{ fontSize:14,fontWeight:500,marginBottom:4 }}>{bill.customer_name}</div>
                {bill.customer_email && <div style={{ fontSize:13,color:'var(--text-2)' }}>{bill.customer_email}</div>}
                {bill.customer_phone && <div style={{ fontSize:13,color:'var(--text-2)' }}>{bill.customer_phone}</div>}
                {bill.customer_address && <div style={{ fontSize:12,color:'var(--text-3)',marginTop:6 }}>{bill.customer_address}, {bill.customer_city}, {bill.customer_state} {bill.customer_zip}</div>}
              </div>
              <div className="card">
                <div className="card-title">Vehicle</div>
                <div style={{ fontSize:14,fontWeight:500,marginBottom:4 }}>{[bill.vehicle_year,bill.vehicle_make,bill.vehicle_model,bill.vehicle_color].filter(Boolean).join(' ')}</div>
                {bill.vehicle_vin && <div style={{ fontFamily:'var(--mono)',fontSize:12,color:'var(--text-2)' }}>VIN: {bill.vehicle_vin}</div>}
                {bill.vehicle_stock && <div style={{ fontSize:12,color:'var(--text-3)' }}>Stock #: {bill.vehicle_stock}</div>}
                {bill.sale_date && <div style={{ fontSize:12,color:'var(--text-3)',marginTop:4 }}>Sale date: {format(new Date(bill.sale_date),'MMM d, yyyy')}</div>}
              </div>
            </div>

            <div className="card" style={{ marginBottom:16 }}>
              <div className="card-title">Promised items ({items.length})</div>
              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th>Bucket</th><th>Description</th><th>Type</th>
                    {canSeeCost && <th style={{ textAlign:'right' }}>Cost</th>}
                    <th style={{ textAlign:'right' }}>Sold price</th>
                    {canSeeCost && <th style={{ textAlign:'right' }}>Margin</th>}
                    <th>Vendor</th><th>Status</th>
                    {isManager && <th>Update</th>}
                  </tr></thead>
                  <tbody>
                    {items.map(item => {
                      const m = Number(item.sold_price||0) - Number(item.cost_price||0)
                      return (
                        <tr key={item.id}>
                          <td style={{ fontSize:11,color:'var(--accent)',fontWeight:600,textTransform:'uppercase',letterSpacing:'0.04em',whiteSpace:'nowrap' }}>{item.bucket_name}</td>
                          <td style={{ fontSize:13 }}>
                            <div style={{ fontWeight:500 }}>{item.description}</div>
                            {item.notes && <div style={{ fontSize:11,color:'var(--text-3)',marginTop:2 }}>{item.notes}</div>}
                          </td>
                          <td><span className={`badge badge-${item.is_internal ? 'external':'internal'}`}>{item.is_internal ? 'External':'Internal'}</span></td>
                          {canSeeCost && <td className="price" style={{ textAlign:'right' }}>${Number(item.cost_price||0).toFixed(2)}</td>}
                          <td className="price" style={{ textAlign:'right',fontWeight:500 }}>${Number(item.sold_price||0).toFixed(2)}</td>
                          {canSeeCost && <td style={{ textAlign:'right',fontSize:12,fontFamily:'var(--mono)',color: m>=0 ? 'var(--green)':'var(--red)' }}>${m.toFixed(2)}</td>}
                          <td style={{ fontSize:12,color:'var(--text-2)' }}>{item.vendor_name || '—'}</td>
                          <td><span className={`badge badge-${item.status}`}>{item.status}</span></td>
                          {isManager && (
                            <td>
                              <select className="form-select" style={{ fontSize:11,padding:'3px 6px',width:'auto' }} value={item.status} onChange={e => updateItemStatus(item.id, e.target.value)}>
                                <option value="pending">Pending</option>
                                <option value="assigned">Assigned</option>
                                <option value="in_progress">In progress</option>
                                <option value="completed">Completed</option>
                              </select>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop:16,padding:'12px 14px',background:'var(--bg)',borderRadius:'var(--radius)',border:'1px solid var(--border)',fontSize:13,maxWidth:340,marginLeft:'auto' }}>
                <div style={{ display:'flex',justifyContent:'space-between',color:'var(--text-2)',marginBottom:5 }}>
                  <span>Subtotal</span><span className="price">${subtotal.toFixed(2)}</span>
                </div>
                <div style={{ display:'flex',justifyContent:'space-between',color:'var(--text-2)',marginBottom:5 }}>
                  <span>Tax ({(Number(bill.tax_rate||0)*100).toFixed(2)}%)</span><span className="price">${tax.toFixed(2)}</span>
                </div>
                <div className="total-row" style={{ display:'flex',justifyContent:'space-between',fontWeight:600 }}>
                  <span>Total</span><span className="price text-accent">${total.toFixed(2)}</span>
                </div>
                {canSeeCost && (
                  <>
                    <div style={{ marginTop:10,paddingTop:10,borderTop:'1px dashed var(--border)',display:'flex',justifyContent:'space-between',color:'var(--text-3)',fontSize:12 }}>
                      <span>Total cost (internal)</span><span className="price">${totalCost.toFixed(2)}</span>
                    </div>
                    <div style={{ display:'flex',justifyContent:'space-between',fontSize:12,fontWeight:500,color: margin>=0 ? 'var(--green)':'var(--red)' }}>
                      <span>Gross margin</span><span className="price">${margin.toFixed(2)}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {bill.notes && (
              <div className="card" style={{ marginBottom:16 }}>
                <div className="card-title">Notes</div>
                <div style={{ fontSize:14,color:'var(--text-2)',lineHeight:1.6 }}>{bill.notes}</div>
              </div>
            )}
            <div style={{ fontSize:12,color:'var(--text-3)' }}>
              Created {format(new Date(bill.created_at),'MMM d, yyyy h:mm a')} by {bill.salesperson_name}
              {bill.approved_at && ` · Approved ${format(new Date(bill.approved_at),'MMM d, yyyy')}`}
            </div>
          </>
        )}

        {/* PHOTOS TAB */}
        {activeTab === 'photos' && (
          <div className="card">
            <div className="card-title">Job photos (max 2)</div>
            <div style={{ fontSize:13,color:'var(--text-2)',marginBottom:16 }}>
              Photos are visible to internal staff and assigned vendors to show what needs to be done.
            </div>
            <ImageUpload
              billId={id}
              images={images}
              onImagesChange={setImages}
              canDelete={isManager || profile?.id === bill.salesperson_id}
            />
            {images.length === 0 && (
              <div style={{ marginTop:16,color:'var(--text-3)',fontSize:13 }}>No photos uploaded yet.</div>
            )}
          </div>
        )}

        {/* SIGNATURE TAB */}
        {activeTab === 'signature' && isManager && (
          <div>
            {signature ? (
              <div className="card" style={{ marginBottom:16 }}>
                <div className="card-title">Captured signature</div>
                <div style={{ marginBottom:12 }}>
                  <img src={signature.signature_data_url} alt="Signature" style={{ maxWidth:400,height:100,objectFit:'contain',border:'1px solid var(--border)',borderRadius:'var(--radius)',background:'var(--bg-input)',padding:8 }} />
                </div>
                <div style={{ fontSize:13,color:'var(--text-2)' }}>
                  Signed by: <strong>{signature.signed_by_name || 'Unknown'}</strong>
                  {signature.signed_at && <span style={{ marginLeft:12,color:'var(--text-3)' }}>{format(new Date(signature.signed_at),'MMM d, yyyy h:mm a')}</span>}
                </div>
                <button className="btn btn-sm" style={{ marginTop:12 }} onClick={() => setShowSignature(true)}>Re-capture signature</button>
              </div>
            ) : (
              <div style={{ marginBottom:16,padding:'14px',background:'var(--accent-dim)',border:'1px solid rgba(232,184,75,0.3)',borderRadius:'var(--radius)',fontSize:13,color:'var(--accent)' }}>
                No signature captured yet — use the pad below to get the customer's signature.
              </div>
            )}
            {(!signature || showSignature) && (
              <SignatureCapture
                onSave={saveSignature}
                onCancel={signature ? () => setShowSignature(false) : null}
                existingSignature={signature?.signature_data_url}
              />
            )}
          </div>
        )}

        {/* PRINT TAB */}
        {activeTab === 'print' && (
          <div>
            <div className="card" style={{ marginBottom:16 }}>
              <div className="card-title">Print / export PDF</div>
              <div style={{ fontSize:13,color:'var(--text-2)',marginBottom:16,lineHeight:1.6 }}>
                The <strong>customer copy</strong> shows sold prices only — cost is never visible to the customer.<br/>
                The <strong>internal copy</strong> shows cost, sold price, and gross margin per item.
              </div>
              <PrintableDueBill
                bill={bill}
                items={items}
                signature={signature}
                dealerName={settings.dealer_name}
                isCustomerView={false}
              />
            </div>
          </div>
        )}
      </div>
    </>
  )
}
