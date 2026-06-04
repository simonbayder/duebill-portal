import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('settings').select('*').single()
    setSettings(data || {})
    setLoading(false)
  }

  function setField(k, v) { setSettings(s => ({...s, [k]: v})) }

  async function save() {
    setSaving(true)
    const { error } = await supabase.from('settings').update({
      dealer_name: settings.dealer_name,
      default_tax_rate: Number(settings.default_tax_rate || 0),
      manager_email: settings.manager_email,
      service_email: settings.service_email,
      accounting_email: settings.accounting_email,
      emailjs_service_id: settings.emailjs_service_id,
      emailjs_manager_template: settings.emailjs_manager_template,
      emailjs_vendor_template: settings.emailjs_vendor_template,
      emailjs_public_key: settings.emailjs_public_key,
      updated_at: new Date().toISOString()
    }).eq('id', 1)
    if (error) toast.error(error.message)
    else toast.success('Settings saved')
    setSaving(false)
  }

  if (loading) return <div className="page-body" style={{ color:'var(--text-3)' }}>Loading...</div>

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Settings</div>
          <div className="page-sub">Configure email notifications, tax rates, and dealership info</div>
        </div>
        <button className="btn btn-primary" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save all changes'}</button>
      </div>
      <div className="page-body" style={{ maxWidth:680 }}>

        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-title">Dealership info</div>
          <div className="form-grid">
            <div className="form-group span-2">
              <label className="form-label">Dealership name</label>
              <input className="form-input" value={settings.dealer_name||''} onChange={e => setField('dealer_name',e.target.value)} placeholder="ABC Motors" />
            </div>
            <div className="form-group">
              <label className="form-label">Default tax rate (decimal)</label>
              <input className="form-input" type="number" step="0.0001" min="0" max="0.3" value={settings.default_tax_rate||''} onChange={e => setField('default_tax_rate',e.target.value)} placeholder="0.0825" />
              <span style={{ fontSize:11,color:'var(--text-3)',marginTop:2 }}>e.g. 0.0825 = 8.25%. Applied to external items only. Can be overridden per bill.</span>
            </div>
            <div className="form-group">
              <label className="form-label">Manager / approval email</label>
              <input className="form-input" type="email" value={settings.manager_email||''} onChange={e => setField('manager_email',e.target.value)} placeholder="manager@dealership.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Service dept email</label>
              <input className="form-input" type="email" value={settings.service_email||''} onChange={e => setField('service_email',e.target.value)} placeholder="service@dealership.com" />
            </div>
            <div className="form-group">
              <label className="form-label">Accounting email</label>
              <input className="form-input" type="email" value={settings.accounting_email||''} onChange={e => setField('accounting_email',e.target.value)} placeholder="accounting@dealership.com" />
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom:16 }}>
          <div className="card-title">EmailJS — automatic notifications</div>
          <div style={{ fontSize:13,color:'var(--text-2)',marginBottom:16,padding:'10px 14px',background:'var(--bg)',borderRadius:6,border:'1px solid var(--border)' }}>
            EmailJS sends emails directly from the browser — no backend needed. Free plan = 200 emails/month.
            <br/><a href="https://www.emailjs.com" target="_blank" rel="noopener" style={{ color:'var(--accent)' }}>Create a free account at emailjs.com →</a>
          </div>
          <div className="form-grid">
            <div className="form-group span-2">
              <label className="form-label">Public key</label>
              <input className="form-input" value={settings.emailjs_public_key||''} onChange={e => setField('emailjs_public_key',e.target.value)} placeholder="Your EmailJS public key" />
            </div>
            <div className="form-group">
              <label className="form-label">Service ID</label>
              <input className="form-input" value={settings.emailjs_service_id||''} onChange={e => setField('emailjs_service_id',e.target.value)} placeholder="service_xxxxxxx" />
            </div>
            <div className="form-group">
              <label className="form-label">Manager approval template ID</label>
              <input className="form-input" value={settings.emailjs_manager_template||''} onChange={e => setField('emailjs_manager_template',e.target.value)} placeholder="template_xxxxxxx" />
            </div>
            <div className="form-group span-2">
              <label className="form-label">Vendor notification template ID</label>
              <input className="form-input" value={settings.emailjs_vendor_template||''} onChange={e => setField('emailjs_vendor_template',e.target.value)} placeholder="template_xxxxxxx" />
            </div>
          </div>
          <div style={{ marginTop:16,padding:'12px 14px',background:'var(--bg)',borderRadius:6,border:'1px solid var(--border)',fontSize:12,color:'var(--text-3)' }}>
            <div style={{ fontWeight:600,marginBottom:8,color:'var(--text-2)' }}>Email template variables to use in EmailJS:</div>
            <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:'4px 20px' }}>
              {['{{ticket_id}}','{{customer_name}}','{{vehicle}}','{{vin}}','{{items_list}}','{{subtotal}}','{{tax_amount}}','{{total}}','{{dealer_name}}','{{submitted_by}}','{{approval_link}}','{{notes}}'].map(v => (
                <code key={v} style={{ fontFamily:'var(--mono)',fontSize:11 }}>{v}</code>
              ))}
            </div>
            <div style={{ marginTop:8,color:'var(--text-3)' }}>Vendor template also includes: <code style={{ fontFamily:'var(--mono)',fontSize:11 }}>{'{{job_description}} {{bucket}} {{estimated_price}} {{vehicle_color}} {{portal_link}}'}</code></div>
          </div>
        </div>

        <button className="btn btn-primary" onClick={save} disabled={saving} style={{ width:'100%',justifyContent:'center' }}>
          {saving ? 'Saving...' : 'Save all settings'}
        </button>
      </div>
    </>
  )
}
