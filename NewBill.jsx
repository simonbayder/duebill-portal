import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { sendManagerApprovalEmail } from '../lib/email'
import toast from 'react-hot-toast'

export default function NewBill() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [buckets, setBuckets] = useState([])
  const [vendors, setVendors] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const [form, setForm] = useState({
    customer_name: '', customer_email: '', customer_phone: '',
    customer_address: '', customer_city: '', customer_state: '', customer_zip: '',
    vehicle_year: '', vehicle_make: '', vehicle_model: '', vehicle_vin: '',
    vehicle_stock: '', vehicle_color: '', sale_date: '',
    notes: ''
  })

  const [items, setItems] = useState([])
  const [taxRate, setTaxRate] = useState(0.0875)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [{ data: bkts }, { data: vnds }, { data: cfg }] = await Promise.all([
      supabase.from('buckets').select('*').eq('active', true).order('sort_order'),
      supabase.from('profiles').select('id,full_name,email,vendor_name').eq('role', 'vendor'),
      supabase.from('settings').select('*').single()
    ])
    if (bkts) setBuckets(bkts)
    if (vnds) setVendors(vnds)
    if (cfg) setTaxRate(Number(cfg.default_tax_rate || 0.0875))
  }

  function setField(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function addItem(bucket) {
    setItems(prev => [...prev, {
      _id: Date.now(),
      bucket_id: bucket.id,
      bucket_name: bucket.name,
      description: '',
      is_internal: false,
      estimated_price: Number(bucket.default_price || 0),
      cost_price: 0,
      sold_price: Number(bucket.default_price || 0),
      vendor_id: null,
      vendor_name: null,
      vendor_email: null,
      notes: ''
    }])
  }

  function updateItem(id, key, value) {
    setItems(prev => prev.map(i => i._id === id ? { ...i, [key]: value } : i))
  }

  function removeItem(id) {
    setItems(prev => prev.filter(i => i._id !== id))
  }

  function setVendor(itemId, vendorId) {
    const v = vendors.find(v => v.id === vendorId)
    updateItem(itemId, 'vendor_id', vendorId || null)
    updateItem(itemId, 'vendor_name', v?.vendor_name || v?.full_name || null)
    updateItem(itemId, 'vendor_email', v?.email || null)
  }

  const subtotal = items.reduce((s, i) => s + Number(i.sold_price || 0), 0)
  const taxableAmount = items.filter(i => !i.is_internal).reduce((s, i) => s + Number(i.sold_price || 0), 0)
  const taxAmount = taxableAmount * taxRate
  const total = subtotal + taxAmount

  async function handleSubmit(asDraft = false) {
    if (!form.customer_name) return toast.error('Customer name is required')
    if (items.length === 0) return toast.error('Add at least one item')

    setSubmitting(true)
    try {
      const billData = {
        customer_name: form.customer_name,
        customer_email: form.customer_email || null,
        customer_phone: form.customer_phone || null,
        customer_address: form.customer_address || null,
        customer_city: form.customer_city || null,
        customer_state: form.customer_state || null,
        customer_zip: form.customer_zip || null,
        vehicle_year: form.vehicle_year || null,
        vehicle_make: form.vehicle_make || null,
        vehicle_model: form.vehicle_model || null,
        vehicle_vin: form.vehicle_vin || null,
        vehicle_stock: form.vehicle_stock || null,
        vehicle_color: form.vehicle_color || null,
        sale_date: form.sale_date || null,
        notes: form.notes || null,
        salesperson_id: profile.id,
        salesperson_name: profile.full_name,
        status: asDraft ? 'draft' : 'pending_approval',
        tax_rate: taxRate
      }

      // ✅ Insert and get the new bill back in one step
      const { data: bill, error: insertError } = await supabase
        .from('due_bills')
        .insert(billData)
        .select()
        .single()

      if (insertError) {
        toast.error('Error saving bill: ' + insertError.message)
        setSubmitting(false)
        return
      }

      // Save line items
      if (bill && bill.id) {
        const lineItems = items.map(({ _id, ...i }) => ({
          ...i,
          due_bill_id: bill.id,
          vendor_id: i.vendor_id || null,
          bucket_id: i.bucket_id || null,
          vendor_name: i.vendor_name || null,
          vendor_email: i.vendor_email || null
        }))
        await supabase.from('due_bill_items').insert(lineItems)

        // Send email
        if (!asDraft) {
          try {
            await sendManagerApprovalEmail({ dueBill: bill, items, submitterName: profile.full_name })
            toast.success('Due bill submitted — manager notified by email')
          } catch (emailErr) {
            toast.success('Due bill submitted — email notification failed, check Settings')
          }
        } else {
          toast.success('Saved as draft')
        }

        navigate(`/bills/${bill.id}`)
      } else {
        toast.success(asDraft ? 'Saved as draft' : 'Due bill submitted successfully')
        navigate('/')
      }

    } catch (err) {
      toast.error('Something went wrong: ' + err.message)
    }
    setSubmitting(false)
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">New due bill</div>
          <div className="page-sub">Fill in customer, vehicle, and all promised items</div>
        </div>
        <div className="row">
          <button className="btn" onClick={() => handleSubmit(true)} disabled={submitting}>Save draft</button>
          <button className="btn btn-primary" onClick={() => handleSubmit(false)} disabled={submitting}>
            Submit for approval
          </button>
        </div>
      </div>
      <div className="page-body" style={{ maxWidth: 900 }}>

        {/* Customer */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">Customer information</div>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Customer name *</label>
              <input className="form-input" value={form.customer_name} onChange={e => setField('customer_name', e.target.value)} placeholder="Full name" /></div>
            <div className="form-group"><label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.customer_email} onChange={e => setField('customer_email', e.target.value)} placeholder="customer@email.com" /></div>
            <div className="form-group"><label className="form-label">Phone</label>
              <input className="form-input" value={form.customer_phone} onChange={e => setField('customer_phone', e.target.value)} placeholder="(555) 000-0000" /></div>
            <div className="form-group"><label className="form-label">Sale date</label>
              <input className="form-input" type="date" value={form.sale_date} onChange={e => setField('sale_date', e.target.value)} /></div>
            <div className="form-group span-2"><label className="form-label">Street address</label>
              <input className="form-input" value={form.customer_address} onChange={e => setField('customer_address', e.target.value)} placeholder="123 Main St" /></div>
            <div className="form-group"><label className="form-label">City</label>
              <input className="form-input" value={form.customer_city} onChange={e => setField('customer_city', e.target.value)} /></div>
            <div className="form-group" style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10 }}>
              <div className="form-group"><label className="form-label">State</label>
                <input className="form-input" value={form.customer_state} onChange={e => setField('customer_state', e.target.value)} placeholder="CA" maxLength={2} /></div>
              <div className="form-group"><label className="form-label">ZIP</label>
                <input className="form-input" value={form.customer_zip} onChange={e => setField('customer_zip', e.target.value)} placeholder="95825" /></div>
            </div>
          </div>
        </div>

        {/* Vehicle */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">Vehicle information</div>
          <div className="form-grid">
            <div className="form-group"><label className="form-label">Year</label>
              <input className="form-input" value={form.vehicle_year} onChange={e => setField('vehicle_year', e.target.value)} placeholder="2024" /></div>
            <div className="form-group"><label className="form-label">Make</label>
              <input className="form-input" value={form.vehicle_make} onChange={e => setField('vehicle_make', e.target.value)} placeholder="Ford" /></div>
            <div className="form-group"><label className="form-label">Model</label>
              <input className="form-input" value={form.vehicle_model} onChange={e => setField('vehicle_model', e.target.value)} placeholder="F-150" /></div>
            <div className="form-group"><label className="form-label">Color</label>
              <input className="form-input" value={form.vehicle_color} onChange={e => setField('vehicle_color', e.target.value)} placeholder="Iconic Silver" /></div>
            <div className="form-group"><label className="form-label">VIN</label>
              <input className="form-input" value={form.vehicle_vin} onChange={e => setField('vehicle_vin', e.target.value)} placeholder="17-character VIN" style={{ fontFamily:'var(--mono)',fontSize:13 }} /></div>
            <div className="form-group"><label className="form-label">Stock #</label>
              <input className="form-input" value={form.vehicle_stock} onChange={e => setField('vehicle_stock', e.target.value)} /></div>
          </div>
        </div>

        {/* Items */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="row" style={{ marginBottom: 14 }}>
            <div className="card-title" style={{ marginBottom: 0 }}>Promised items</div>
          </div>
          <div style={{ marginBottom: 16 }}>
            <div className="form-label" style={{ marginBottom: 8 }}>Add item from bucket:</div>
            <div style={{ display:'flex',flexWrap:'wrap',gap:8 }}>
              {buckets.map(b => (
                <button key={b.id} className="btn btn-sm" onClick={() => addItem(b)}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="11" height="11"><path d="M12 5v14M5 12h14"/></svg>
                  {b.name}
                </button>
              ))}
            </div>
          </div>
          {items.length === 0 && (
            <div style={{ padding:'20px 0',textAlign:'center',color:'var(--text-3)',fontSize:13,borderTop:'1px solid var(--border)' }}>
              No items added yet — click a bucket above to add a line item
            </div>
          )}
          <div className="items-container">
            {items.map(item => (
              <div key={item._id} className="item-row">
                <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10 }}>
                  <span style={{ fontSize:12,fontWeight:600,color:'var(--accent)',textTransform:'uppercase',letterSpacing:'0.04em' }}>{item.bucket_name}</span>
                  <button className="item-delete" onClick={() => removeItem(item._id)}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M18 6L6 18M6 6l12 12"/></svg>
                  </button>
                </div>
                <div className="form-grid" style={{ gap:10 }}>
                  <div className="form-group span-2">
                    <label className="form-label">Description</label>
                    <input className="form-input" value={item.description} onChange={e => updateItem(item._id,'description',e.target.value)} placeholder="Describe the item or service promised..." />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ display:'flex',alignItems:'center',gap:6 }}>
                      Cost <span style={{ fontSize:10,padding:'1px 6px',background:'var(--accent-dim)',color:'var(--accent)',borderRadius:10,fontWeight:600 }}>INTERNAL ONLY</span>
                    </label>
                    <input className="form-input" type="number" min="0" step="0.01" value={item.cost_price} onChange={e => updateItem(item._id,'cost_price',e.target.value)} placeholder="0.00" />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ display:'flex',alignItems:'center',gap:6 }}>
                      Sold price <span style={{ fontSize:10,padding:'1px 6px',background:'var(--blue-dim)',color:'var(--blue)',borderRadius:10,fontWeight:600 }}>SHOWN TO CUSTOMER</span>
                    </label>
                    <input className="form-input" type="number" min="0" step="0.01" value={item.sold_price} onChange={e => updateItem(item._id,'sold_price',e.target.value)} placeholder="0.00" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Internal or external?</label>
                    <div className="toggle-group">
                      <button className={`toggle-opt${!item.is_internal ? ' active-internal' : ''}`} onClick={() => updateItem(item._id,'is_internal',false)}>Internal</button>
                      <button className={`toggle-opt${item.is_internal ? ' active-external' : ''}`} onClick={() => updateItem(item._id,'is_internal',true)}>External</button>
                    </div>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assign to vendor (optional)</label>
                    <select className="form-select" value={item.vendor_id || ''} onChange={e => setVendor(item._id, e.target.value)}>
                      <option value="">— None / Internal —</option>
                      {vendors.map(v => <option key={v.id} value={v.id}>{v.vendor_name || v.full_name}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Item notes</label>
                    <input className="form-input" value={item.notes || ''} onChange={e => updateItem(item._id,'notes',e.target.value)} placeholder="Any special instructions..." />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {items.length > 0 && (
            <div style={{ marginTop:16,padding:'14px 16px',background:'var(--bg)',borderRadius:'var(--radius)',border:'1px solid var(--border)' }}>
              <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,color:'var(--text-2)',marginBottom:6 }}>
                <span>Subtotal</span><span className="price">${subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display:'flex',justifyContent:'space-between',fontSize:13,color:'var(--text-2)',marginBottom:6 }}>
                <span>Tax ({(taxRate * 100).toFixed(2)}%) on external items</span>
                <span className="price">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="total-row" style={{ display:'flex',justifyContent:'space-between',fontWeight:600 }}>
                <span>Total</span><span className="price text-accent">${total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Tax / notes */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-title">Tax rate &amp; notes</div>
          <div className="form-grid">
            <div className="form-group">
              <label className="form-label">Tax rate (decimal)</label>
              <input className="form-input" type="number" min="0" max="0.3" step="0.0001" value={taxRate} onChange={e => setTaxRate(Number(e.target.value))} />
              <span style={{ fontSize:11,color:'var(--text-3)',marginTop:2 }}>Applied to external items only</span>
            </div>
            <div className="form-group">
              <label className="form-label">Internal notes</label>
              <textarea className="form-textarea" value={form.notes} onChange={e => setField('notes', e.target.value)} placeholder="Anything for the manager or accounting..." />
            </div>
          </div>
        </div>

        <div className="row">
          <button className="btn" onClick={() => navigate(-1)}>Cancel</button>
          <div className="spacer" />
          <button className="btn" onClick={() => handleSubmit(true)} disabled={submitting}>Save draft</button>
          <button className="btn btn-primary" onClick={() => handleSubmit(false)} disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit for approval'}
          </button>
        </div>
      </div>
    </>
  )
}
