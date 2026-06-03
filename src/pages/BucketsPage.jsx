import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function BucketsPage() {
  const [buckets, setBuckets] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [showNew, setShowNew] = useState(false)
  const [newBucket, setNewBucket] = useState({ name:'', default_price:'', description:'' })

  useEffect(() => { load() }, [])

  async function load() {
    const { data } = await supabase.from('buckets').select('*').order('sort_order')
    setBuckets(data || [])
    setLoading(false)
  }

  async function saveBucket(bucket) {
    const { error } = await supabase.from('buckets').update({
      name: bucket.name,
      default_price: Number(bucket.default_price || 0),
      description: bucket.description,
      active: bucket.active
    }).eq('id', bucket.id)
    if (error) return toast.error(error.message)
    toast.success('Bucket updated')
    setEditing(null)
    load()
  }

  async function createBucket() {
    if (!newBucket.name.trim()) return toast.error('Name is required')
    const { error } = await supabase.from('buckets').insert({
      name: newBucket.name,
      default_price: Number(newBucket.default_price || 0),
      description: newBucket.description,
      sort_order: buckets.length + 1
    })
    if (error) return toast.error(error.message)
    toast.success('Bucket created')
    setShowNew(false)
    setNewBucket({ name:'', default_price:'', description:'' })
    load()
  }

  async function toggleActive(bucket) {
    await supabase.from('buckets').update({ active: !bucket.active }).eq('id', bucket.id)
    load()
  }

  async function moveUp(bucket) {
    const idx = buckets.findIndex(b => b.id === bucket.id)
    if (idx === 0) return
    const prev = buckets[idx - 1]
    await Promise.all([
      supabase.from('buckets').update({ sort_order: prev.sort_order }).eq('id', bucket.id),
      supabase.from('buckets').update({ sort_order: bucket.sort_order }).eq('id', prev.id)
    ])
    load()
  }

  async function moveDown(bucket) {
    const idx = buckets.findIndex(b => b.id === bucket.id)
    if (idx === buckets.length - 1) return
    const next = buckets[idx + 1]
    await Promise.all([
      supabase.from('buckets').update({ sort_order: next.sort_order }).eq('id', bucket.id),
      supabase.from('buckets').update({ sort_order: bucket.sort_order }).eq('id', next.id)
    ])
    load()
  }

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">Manage buckets</div>
          <div className="page-sub">Customize due bill categories and default prices</div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowNew(!showNew)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M12 5v14M5 12h14"/></svg>
          Add bucket
        </button>
      </div>
      <div className="page-body" style={{ maxWidth:740 }}>

        {showNew && (
          <div className="card" style={{ marginBottom:16,borderColor:'rgba(232,184,75,0.3)' }}>
            <div className="card-title">New bucket</div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Bucket name *</label>
                <input className="form-input" value={newBucket.name} onChange={e => setNewBucket(b => ({...b,name:e.target.value}))} placeholder="e.g. Ceramic Coating" />
              </div>
              <div className="form-group">
                <label className="form-label">Default price ($)</label>
                <input className="form-input" type="number" min="0" step="0.01" value={newBucket.default_price} onChange={e => setNewBucket(b => ({...b,default_price:e.target.value}))} placeholder="0.00" />
              </div>
              <div className="form-group span-2">
                <label className="form-label">Description (optional)</label>
                <input className="form-input" value={newBucket.description} onChange={e => setNewBucket(b => ({...b,description:e.target.value}))} placeholder="Short description of what this bucket covers..." />
              </div>
            </div>
            <div className="row" style={{ marginTop:12 }}>
              <button className="btn btn-primary" onClick={createBucket}>Create bucket</button>
              <button className="btn" onClick={() => setShowNew(false)}>Cancel</button>
            </div>
          </div>
        )}

        <div className="card">
          <div style={{ fontSize:12,color:'var(--text-3)',marginBottom:16 }}>
            {buckets.filter(b=>b.active).length} active buckets · {buckets.filter(b=>!b.active).length} hidden
          </div>
          {loading ? (
            <div style={{ color:'var(--text-3)',fontSize:13 }}>Loading...</div>
          ) : (
            <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
              {buckets.map((bucket, idx) => (
                <div key={bucket.id} style={{
                  border:'1px solid var(--border)',borderRadius:'var(--radius)',overflow:'hidden',
                  opacity: bucket.active ? 1 : 0.5
                }}>
                  {editing?.id === bucket.id ? (
                    <div style={{ padding:14 }}>
                      <div className="form-grid" style={{ gap:10 }}>
                        <div className="form-group">
                          <label className="form-label">Name</label>
                          <input className="form-input" value={editing.name} onChange={e => setEditing(ed => ({...ed,name:e.target.value}))} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Default price ($)</label>
                          <input className="form-input" type="number" step="0.01" value={editing.default_price} onChange={e => setEditing(ed => ({...ed,default_price:e.target.value}))} />
                        </div>
                        <div className="form-group span-2">
                          <label className="form-label">Description</label>
                          <input className="form-input" value={editing.description||''} onChange={e => setEditing(ed => ({...ed,description:e.target.value}))} />
                        </div>
                      </div>
                      <div className="row" style={{ marginTop:10 }}>
                        <button className="btn btn-primary btn-sm" onClick={() => saveBucket(editing)}>Save</button>
                        <button className="btn btn-sm" onClick={() => setEditing(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding:'12px 14px',display:'flex',alignItems:'center',gap:12 }}>
                      <div style={{ display:'flex',flexDirection:'column',gap:2 }}>
                        <button className="btn btn-icon btn-sm" onClick={() => moveUp(bucket)} title="Move up" style={{ padding:'2px 5px' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10"><path d="M18 15l-6-6-6 6"/></svg>
                        </button>
                        <button className="btn btn-icon btn-sm" onClick={() => moveDown(bucket)} title="Move down" style={{ padding:'2px 5px' }}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="10" height="10"><path d="M6 9l6 6 6-6"/></svg>
                        </button>
                      </div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontWeight:500,fontSize:14 }}>{bucket.name}</div>
                        {bucket.description && <div style={{ fontSize:12,color:'var(--text-3)',marginTop:1 }}>{bucket.description}</div>}
                      </div>
                      <div style={{ fontFamily:'var(--mono)',fontSize:13,color:'var(--accent)',minWidth:70,textAlign:'right' }}>
                        ${Number(bucket.default_price||0).toFixed(2)}
                      </div>
                      <div className="row" style={{ gap:6 }}>
                        <button className="btn btn-sm" onClick={() => setEditing({...bucket})}>Edit</button>
                        <button className="btn btn-sm" onClick={() => toggleActive(bucket)} style={{ color: bucket.active ? 'var(--text-3)' : 'var(--green)' }}>
                          {bucket.active ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}
