import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { sendManagerApprovalEmail } from '../lib/email'
import toast from 'react-hot-toast'

// California county tax rates (as of 2024)
const CA_COUNTY_TAX_RATES = {
  // Alameda County - 10.25%
  '94501':0.1025,'94502':0.1025,'94536':0.1025,'94537':0.1025,'94538':0.1025,'94539':0.1025,
  '94540':0.1025,'94541':0.1025,'94542':0.1025,'94543':0.1025,'94544':0.1025,'94545':0.1025,
  '94546':0.1025,'94550':0.1025,'94551':0.1025,'94552':0.1025,'94555':0.1025,'94560':0.1025,
  '94566':0.1025,'94568':0.1025,'94577':0.1025,'94578':0.1025,'94579':0.1025,'94580':0.1025,
  '94586':0.1025,'94587':0.1025,'94588':0.1025,'94601':0.1025,'94602':0.1025,'94603':0.1025,
  '94605':0.1025,'94606':0.1025,'94607':0.1025,'94608':0.1025,'94609':0.1025,'94610':0.1025,
  '94611':0.1025,'94612':0.1025,'94613':0.1025,'94618':0.1025,'94619':0.1025,'94621':0.1025,
  // Sacramento County - 8.75%
  '94203':0.0775,'94204':0.0775,'94205':0.0775,'94206':0.0775,'94207':0.0775,'94208':0.0775,
  '94209':0.0775,'94211':0.0775,'94229':0.0775,'94230':0.0775,'94232':0.0775,'94234':0.0775,
  '94235':0.0775,'94236':0.0775,'94237':0.0775,'94239':0.0775,'94240':0.0775,'94244':0.0775,
  '94245':0.0775,'94247':0.0775,'94248':0.0775,'94249':0.0775,'94250':0.0775,'94252':0.0775,
  '94254':0.0775,'94256':0.0775,'94257':0.0775,'94258':0.0775,'94259':0.0775,'94261':0.0775,
  '94262':0.0775,'94263':0.0775,'94267':0.0775,'94268':0.0775,'94269':0.0775,'94271':0.0775,
  '94273':0.0775,'94274':0.0775,'94277':0.0775,'94278':0.0775,'94279':0.0775,'94280':0.0775,
  '94282':0.0775,'94283':0.0775,'94284':0.0775,'94285':0.0775,'94286':0.0775,'94287':0.0775,
  '94288':0.0775,'94289':0.0775,'94290':0.0775,'94291':0.0775,'94293':0.0775,'94294':0.0775,
  '94295':0.0775,'94296':0.0775,'94297':0.0775,'94298':0.0775,'94299':0.0775,
  '95608':0.0775,'95609':0.0775,'95610':0.0775,'95611':0.0775,'95615':0.0775,'95621':0.0775,
  '95624':0.0775,'95626':0.0775,'95628':0.0775,'95630':0.0775,'95632':0.0775,'95638':0.0775,
  '95641':0.0775,'95648':0.0775,'95652':0.0775,'95655':0.0775,'95660':0.0775,'95662':0.0775,
  '95670':0.0775,'95671':0.0775,'95672':0.0775,'95673':0.0775,'95678':0.0775,'95683':0.0775,
  '95690':0.0775,'95693':0.0775,'95741':0.0775,'95742':0.0775,'95757':0.0775,'95758':0.0775,
  '95762':0.0775,'95763':0.0775,'95811':0.0775,'95812':0.0775,'95813':0.0775,'95814':0.0775,
  '95815':0.0775,'95816':0.0775,'95817':0.0775,'95818':0.0775,'95819':0.0775,'95820':0.0775,
  '95821':0.0775,'95822':0.0775,'95823':0.0775,'95824':0.0775,'95825':0.0775,'95826':0.0775,
  '95827':0.0775,'95828':0.0775,'95829':0.0775,'95830':0.0775,'95831':0.0775,'95832':0.0775,
  '95833':0.0775,'95834':0.0775,'95835':0.0775,'95836':0.0775,'95837':0.0775,'95838':0.0775,
  '95840':0.0775,'95841':0.0775,'95842':0.0775,'95843':0.0775,'95851':0.0775,'95852':0.0775,
  '95853':0.0775,'95860':0.0775,'95864':0.0775,'95865':0.0775,'95866':0.0775,'95867':0.0775,
  '95894':0.0775,'95899':0.0775,
  // Los Angeles County - 10.25%
  '90001':0.1025,'90002':0.1025,'90003':0.1025,'90004':0.1025,'90005':0.1025,'90006':0.1025,
  '90007':0.1025,'90008':0.1025,'90010':0.1025,'90011':0.1025,'90012':0.1025,'90013':0.1025,
  '90014':0.1025,'90015':0.1025,'90016':0.1025,'90017':0.1025,'90018':0.1025,'90019':0.1025,
  '90020':0.1025,'90021':0.1025,'90022':0.1025,'90023':0.1025,'90024':0.1025,'90025':0.1025,
  '90026':0.1025,'90027':0.1025,'90028':0.1025,'90029':0.1025,'90031':0.1025,'90032':0.1025,
  '90033':0.1025,'90034':0.1025,'90035':0.1025,'90036':0.1025,'90037':0.1025,'90038':0.1025,
  '90039':0.1025,'90040':0.1025,'90041':0.1025,'90042':0.1025,'90043':0.1025,'90044':0.1025,
  '90045':0.1025,'90046':0.1025,'90047':0.1025,'90048':0.1025,'90049':0.1025,'90056':0.1025,
  // San Diego County - 7.75%
  '91901':0.0775,'91902':0.0775,'91903':0.0775,'91905':0.0775,'91906':0.0775,'91908':0.0775,
  '91909':0.0775,'91910':0.0775,'91911':0.0775,'91912':0.0775,'91913':0.0775,'91914':0.0775,
  '91915':0.0775,'91916':0.0775,'91917':0.0775,'91921':0.0775,'91931':0.0775,'91932':0.0775,
  '91933':0.0775,'91934':0.0775,'91935':0.0775,'91941':0.0775,'91942':0.0775,'91943':0.0775,
  '91944':0.0775,'91945':0.0775,'91946':0.0775,'91947':0.0775,'91948':0.0775,'91950':0.0775,
  '91951':0.0775,'91962':0.0775,'91963':0.0775,'91976':0.0775,'91977':0.0775,'91978':0.0775,
  '91979':0.0775,'91980':0.0775,'91987':0.0775,'92003':0.0775,'92004':0.0775,'92007':0.0775,
  '92008':0.0775,'92009':0.0775,'92010':0.0775,'92011':0.0775,'92013':0.0775,'92014':0.0775,
  // San Francisco County - 8.625%
  '94102':0.08625,'94103':0.08625,'94104':0.08625,'94105':0.08625,'94107':0.08625,'94108':0.08625,
  '94109':0.08625,'94110':0.08625,'94111':0.08625,'94112':0.08625,'94114':0.08625,'94115':0.08625,
  '94116':0.08625,'94117':0.08625,'94118':0.08625,'94119':0.08625,'94120':0.08625,'94121':0.08625,
  '94122':0.08625,'94123':0.08625,'94124':0.08625,'94125':0.08625,'94126':0.08625,'94127':0.08625,
  '94128':0.08625,'94129':0.08625,'94130':0.08625,'94131':0.08625,'94132':0.08625,'94133':0.08625,
  '94134':0.08625,'94137':0.08625,'94139':0.08625,'94140':0.08625,'94141':0.08625,'94142':0.08625,
  '94143':0.08625,'94144':0.08625,'94145':0.08625,'94146':0.08625,'94147':0.08625,'94151':0.08625,
  '94158':0.08625,'94159':0.08625,'94160':0.08625,'94161':0.08625,'94163':0.08625,'94164':0.08625,
  '94172':0.08625,'94177':0.08625,'94188':0.08625,
  // Orange County - 7.75%
  '92602':0.0775,'92603':0.0775,'92604':0.0775,'92606':0.0775,'92610':0.0775,'92612':0.0775,
  '92614':0.0775,'92617':0.0775,'92618':0.0775,'92620':0.0775,'92624':0.0775,'92625':0.0775,
  '92626':0.0775,'92627':0.0775,'92628':0.0775,'92629':0.0775,'92630':0.0775,'92637':0.0775,
  '92646':0.0775,'92647':0.0775,'92648':0.0775,'92649':0.0775,'92651':0.0775,'92652':0.0775,
  '92653':0.0775,'92654':0.0775,'92655':0.0775,'92656':0.0775,'92657':0.0775,'92658':0.0775,
  '92659':0.0775,'92660':0.0775,'92661':0.0775,'92662':0.0775,'92663':0.0775,'92672':0.0775,
  '92673':0.0775,'92674':0.0775,'92675':0.0775,'92676':0.0775,'92677':0.0775,'92678':0.0775,
  '92679':0.0775,'92683':0.0775,'92684':0.0775,'92685':0.0775,'92688':0.0775,'92691':0.0775,
  '92692':0.0775,'92693':0.0775,'92694':0.0775,'92697':0.0775,'92698':0.0775,'92701':0.0775,
  '92702':0.0775,'92703':0.0775,'92704':0.0775,'92705':0.0775,'92706':0.0775,'92707':0.0775,
  '92708':0.0775,'92711':0.0775,'92712':0.0775,'92728':0.0775,'92735':0.0775,'92780':0.0775,
  '92781':0.0775,'92782':0.0775,'92799':0.0775,'92801':0.0775,'92802':0.0775,'92803':0.0775,
  '92804':0.0775,'92805':0.0775,'92806':0.0775,'92807':0.0775,'92808':0.0775,'92809':0.0775,
  '92811':0.0775,'92812':0.0775,'92814':0.0775,'92815':0.0775,'92816':0.0775,'92817':0.0775,
  '92821':0.0775,'92822':0.0775,'92823':0.0775,'92831':0.0775,'92832':0.0775,'92833':0.0775,
  '92834':0.0775,'92835':0.0775,'92836':0.0775,'92837':0.0775,'92838':0.0775,'92840':0.0775,
  '92841':0.0775,'92842':0.0775,'92843':0.0775,'92844':0.0775,'92845':0.0775,'92846':0.0775,
  '92850':0.0775,'92856':0.0775,'92857':0.0775,'92859':0.0775,'92861':0.0775,'92862':0.0775,
  '92863':0.0775,'92864':0.0775,'92865':0.0775,'92866':0.0775,'92867':0.0775,'92868':0.0775,
  '92869':0.0775,'92870':0.0775,'92871':0.0775,'92885':0.0775,'92886':0.0775,'92887':0.0775,
}

function getTaxRateForZip(zip) {
  if (!zip || zip.length < 5) return null
  const z = zip.substring(0, 5)
  return CA_COUNTY_TAX_RATES[z] || null
}

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
    vehicle_stock: '', vehicle_color: '', sale_date: '', deal_number: '',
    notes: ''
  })

  const [items, setItems] = useState([])
  const [taxRate, setTaxRate] = useState(0.0775)
  const [taxSource, setTaxSource] = useState(null)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const [{ data: bkts }, { data: vnds }, { data: cfg }] = await Promise.all([
      supabase.from('buckets').select('*').eq('active', true).order('sort_order'),
      supabase.from('profiles').select('id,full_name,email,vendor_name').eq('role', 'vendor'),
      supabase.from('settings').select('*').single()
    ])
    if (bkts) setBuckets(bkts)
    if (vnds) setVendors(vnds)
    if (cfg) setTaxRate(Number(cfg.default_tax_rate || 0.0775))
  }

  const [vinLoading, setVinLoading] = useState(false)

  async function decodeVin(vin) {
    if (!vin || vin.length !== 17) return
    setVinLoading(true)
    try {
      const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vin}?format=json`)
      const data = await res.json()
      const results = data.Results
      const get = (var_) => results.find(r => r.Variable === var_)?.Value
      const year = get('Model Year')
      const make = get('Make')
      const model = get('Model')
      if (make && make !== 'null' && make !== null) {
        setForm(f => ({
          ...f,
          vehicle_year: year && year !== 'null' ? year : f.vehicle_year,
          vehicle_make: make,
          vehicle_model: model && model !== 'null' ? model : f.vehicle_model,
        }))
        toast.success(`VIN decoded: ${year} ${make} ${model}`)
      } else {
        toast.error('VIN not recognized — please fill in manually')
      }
    } catch (err) {
      toast.error('VIN decode failed — check your connection')
    }
    setVinLoading(false)
  }

  function setField(k, v) {
    setForm(f => ({ ...f, [k]: v }))
    if (k === 'customer_zip') {
      const rate = getTaxRateForZip(v)
      if (rate !== null) {
        setTaxRate(rate)
        setTaxSource(`Auto-filled from ZIP ${v.substring(0,5)}`)
      } else {
        setTaxSource(null)
      }
    }
  }

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
    if (!form.deal_number) return toast.error('Deal # is required')
    if (items.length === 0) return toast.error('Add at least one item')
    if (!profile?.id) return toast.error('Profile not loaded — please refresh')

    setSubmitting(true)
    try {
      const billData = {
        deal_number: form.deal_number || null,
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

      const { data: bill, error: insertError } = await supabase
        .from('due_bills')
        .insert(billData)
        .select()
        .single()

      console.log('INSERT RESULT:', bill, insertError)

      if (insertError) {
        toast.error('Error saving bill: ' + insertError.message)
        setSubmitting(false)
        return
      }

      if (!bill || !bill.id) {
        toast.error('Bill saved but could not retrieve ID — contact support')
        setSubmitting(false)
        return
      }

      const lineItems = items.map(({ _id, ...i }) => ({
        ...i,
        due_bill_id: bill.id,
        vendor_id: i.vendor_id || null,
        bucket_id: i.bucket_id || null,
        vendor_name: i.vendor_name || null,
        vendor_email: i.vendor_email || null,
        estimated_price: i.estimated_price || null,
      }))

      const { error: itemsError } = await supabase.from('due_bill_items').insert(lineItems)
      if (itemsError) console.error('Line items error:', itemsError)

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

    } catch (err) {
      toast.error('Something went wrong: ' + err.message)
      console.error(err)
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
            <div className="form-group"><label className="form-label">Deal # *</label>
              <input className="form-input" value={form.deal_number} onChange={e => setField('deal_number', e.target.value)} placeholder="Deal number" /></div>
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
                <input className="form-input" value={form.customer_zip} onChange={e => setField('customer_zip', e.target.value)} placeholder="95825" maxLength={5} />
                {taxSource && <span style={{ fontSize:11,color:'var(--green)',marginTop:2,display:'block' }}>✓ {taxSource} — {(taxRate*100).toFixed(4)}%</span>}
              </div>
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
              <div style={{ position:'relative' }}>
                <input className="form-input" value={form.vehicle_vin} onChange={e => setField('vehicle_vin', e.target.value)} onBlur={e => decodeVin(e.target.value)} placeholder="17-character VIN" style={{ fontFamily:'var(--mono)',fontSize:13,paddingRight: vinLoading ? 36 : undefined }} />
                {vinLoading && <span style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',fontSize:11,color:'var(--text-3)' }}>⏳</span>}
              </div>
              <span style={{ fontSize:11,color:'var(--text-3)',marginTop:2 }}>Auto-fills year, make &amp; model</span>
            </div>
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
                <span>Tax ({(taxRate * 100).toFixed(4)}%) on external items</span>
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
              <input className="form-input" type="number" min="0" max="0.3" step="0.0001" value={taxRate} onChange={e => { setTaxRate(Number(e.target.value)); setTaxSource(null) }} />
              <span style={{ fontSize:11,color:'var(--text-3)',marginTop:2 }}>
                {taxSource ? `Auto-filled from ZIP — ${(taxRate*100).toFixed(4)}%` : 'Applied to external items only'}
              </span>
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
