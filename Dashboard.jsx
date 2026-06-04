import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

async function getSignedUrl(path) {
  const { data } = await supabase.storage.from('due-bill-images').createSignedUrl(path, 3600)
  return data?.signedUrl
}

export default function VendorPortal() {
  const { profile } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [profile])

  async function load() {
    const { data } = await supabase
      .from('due_bill_items')
      .select('*, due_bills(id,bill_number,customer_name,vehicle_year,vehicle_make,vehicle_model,vehicle_vin,vehicle_color,status)')
      .eq('vendor_id', profile.id)
      .order('created_at', { ascending: false })
    // Load images per unique bill
    const jobData = data || []
    const billIds = [...new Set(jobData.map(j => j.due_bills?.id).filter(Boolean))]
    let imgMap = {}
    if (billIds.length) {
      const { data: imgs } = await supabase.from('due_bill_images').select('*').in('due_bill_id', billIds)
      if (imgs) imgs.forEach(img => {
        if (!imgMap[img.due_bill_id]) imgMap[img.due_bill_id] = []
        imgMap[img.due_bill_id].push(img)
      })
    }
    setJobs(jobData.map(j => ({ ...j, _images: imgMap[j.due_bills?.id] || [] })))
    setLoading(false)
  }

  async function markComplete(itemId) {
    const { error } = await supabase.from('due_bill_items').update({
      status: 'completed',
      completed_at: new Date().toISOString()
    }).eq('id', itemId)
    if (error) return toast.error(error.message)
    toast.success('Job marked as complete')
    load()
  }

  async function markInProgress(itemId) {
    await supabase.from('due_bill_items').update({ status: 'in_progress' }).eq('id', itemId)
    load()
  }

  const open = jobs.filter(j => j.status !== 'completed')
  const done = jobs.filter(j => j.status === 'completed')

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-title">My jobs</div>
          <div className="page-sub">{open.length} open · {done.length} completed</div>
        </div>
      </div>
      <div className="page-body">
        {loading ? (
          <div style={{ color:'var(--text-3)',fontSize:13 }}>Loading...</div>
        ) : jobs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔧</div>
            <p>No jobs assigned to you yet</p>
          </div>
        ) : (
          <>
            {open.length > 0 && (
              <>
                <div className="section-title">Open jobs ({open.length})</div>
                <div style={{ display:'flex',flexDirection:'column',gap:10,marginBottom:28 }}>
                  {open.map(job => (
                    <div key={job.id} className="card">
                      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',gap:12,flexWrap:'wrap' }}>
                        <div style={{ flex:1 }}>
                          <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:6 }}>
                            <span style={{ fontSize:12,fontWeight:600,color:'var(--accent)',textTransform:'uppercase',letterSpacing:'0.04em' }}>{job.bucket_name}</span>
                            <span className={`badge badge-${job.status}`}>{job.status.replace('_',' ')}</span>
                          </div>
                          <div style={{ fontSize:15,fontWeight:500,marginBottom:4 }}>{job.description}</div>
                          <div style={{ fontSize:13,color:'var(--text-2)',marginBottom:2 }}>
                            {job.due_bills?.customer_name} · {[job.due_bills?.vehicle_year,job.due_bills?.vehicle_make,job.due_bills?.vehicle_model].filter(Boolean).join(' ')}
                          </div>
                          {job.due_bills?.vehicle_color && <div style={{ fontSize:12,color:'var(--text-3)' }}>Color: {job.due_bills.vehicle_color}</div>}
                          {job.due_bills?.vehicle_vin && <div style={{ fontSize:12,color:'var(--text-3)',fontFamily:'var(--mono)' }}>VIN: {job.due_bills.vehicle_vin}</div>}
                          {job.notes && <div style={{ fontSize:12,color:'var(--text-3)',marginTop:6,padding:'8px 10px',background:'var(--bg-elevated)',borderRadius:6 }}>Note: {job.notes}</div>}
                          {job._images && job._images.length > 0 && (
                            <div style={{ display:'flex',gap:8,marginTop:10,flexWrap:'wrap' }}>
                              {job._images.map(img => (
                                <div key={img.id} style={{ width:80,height:60,borderRadius:6,overflow:'hidden',border:'1px solid var(--border)',cursor:'pointer',flexShrink:0 }}
                                  onClick={async () => { const url = await getSignedUrl(img.storage_path); if(url) window.open(url,'_blank') }}
                                  title={img.file_name}>
                                  <img src={img.public_url} alt={img.file_name} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                                </div>
                              ))}
                              <div style={{ fontSize:11,color:'var(--text-3)',alignSelf:'center' }}>Tap photos to view full size</div>
                            </div>
                          )}
                          <div style={{ fontSize:12,color:'var(--text-3)',marginTop:8 }}>Bill: <span style={{ fontFamily:'var(--mono)' }}>{job.due_bills?.bill_number}</span> · Est. <span style={{ color:'var(--accent)',fontFamily:'var(--mono)' }}>${Number(job.estimated_price||0).toFixed(2)}</span></div>
                        </div>
                        <div style={{ display:'flex',flexDirection:'column',gap:6 }}>
                          {job.status === 'assigned' && (
                            <button className="btn btn-sm" onClick={() => markInProgress(job.id)}>Start job</button>
                          )}
                          {['assigned','in_progress'].includes(job.status) && (
                            <button className="btn btn-sm btn-success" onClick={() => markComplete(job.id)}>
                              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12"><path d="M20 6L9 17l-5-5"/></svg>
                              Mark complete
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {done.length > 0 && (
              <>
                <div className="section-title" style={{ color:'var(--text-3)' }}>Completed ({done.length})</div>
                <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                  {done.map(job => (
                    <div key={job.id} style={{ padding:'12px 16px',background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:'var(--radius)',opacity:0.7 }}>
                      <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center' }}>
                        <div>
                          <span style={{ fontSize:12,color:'var(--accent)',fontWeight:600 }}>{job.bucket_name}</span>
                          <span style={{ fontSize:13,marginLeft:10 }}>{job.description}</span>
                        </div>
                        <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                          <span className="price" style={{ fontSize:13 }}>${Number(job.estimated_price||0).toFixed(2)}</span>
                          {job.completed_at && <span style={{ fontSize:11,color:'var(--text-3)' }}>Done {format(new Date(job.completed_at),'MMM d')}</span>}
                          <span className="badge badge-completed">Completed</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  )
}
