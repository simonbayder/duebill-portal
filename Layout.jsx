import { useState } from 'react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function ImageUpload({ billId, images, onImagesChange, canDelete }) {
  const [uploading, setUploading] = useState(false)

  async function handleFiles(e) {
    const files = Array.from(e.target.files)
    if (!files.length) return
    const remaining = 2 - images.length
    if (remaining <= 0) return toast.error('Maximum 2 images per due bill')
    const toUpload = files.slice(0, remaining)
    setUploading(true)
    for (const file of toUpload) {
      if (!file.type.startsWith('image/')) { toast.error(`${file.name} is not an image`); continue }
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} is over 10MB`); continue }
      try {
        const ext = file.name.split('.').pop()
        const path = `${billId}/${Date.now()}.${ext}`
        const { error: upErr } = await supabase.storage.from('due-bill-images').upload(path, file)
        if (upErr) throw upErr
        const { data: { publicUrl } } = supabase.storage.from('due-bill-images').getPublicUrl(path)
        const { data: img, error: dbErr } = await supabase.from('due_bill_images').insert({
          due_bill_id: billId,
          storage_path: path,
          public_url: publicUrl,
          file_name: file.name
        }).select().single()
        if (dbErr) throw dbErr
        onImagesChange(prev => [...prev, img])
        toast.success(`${file.name} uploaded`)
      } catch (err) {
        toast.error(`Upload failed: ${err.message}`)
      }
    }
    setUploading(false)
    e.target.value = ''
  }

  async function deleteImage(img) {
    if (!confirm('Remove this image?')) return
    await supabase.storage.from('due-bill-images').remove([img.storage_path])
    await supabase.from('due_bill_images').delete().eq('id', img.id)
    onImagesChange(prev => prev.filter(i => i.id !== img.id))
    toast.success('Image removed')
  }

  async function getSignedUrl(path) {
    const { data } = await supabase.storage.from('due-bill-images').createSignedUrl(path, 3600)
    return data?.signedUrl
  }

  async function openImage(img) {
    const url = await getSignedUrl(img.storage_path)
    if (url) window.open(url, '_blank')
  }

  return (
    <div>
      <div style={{ display:'flex',gap:12,flexWrap:'wrap',marginBottom:images.length < 2 ? 12 : 0 }}>
        {images.map(img => (
          <div key={img.id} style={{
            position:'relative',width:140,height:100,borderRadius:'var(--radius)',
            overflow:'hidden',border:'1px solid var(--border-strong)',cursor:'pointer',flexShrink:0
          }}>
            <img
              src={img.public_url}
              alt={img.file_name}
              style={{ width:'100%',height:'100%',objectFit:'cover' }}
              onClick={() => openImage(img)}
              onError={e => { e.target.style.display='none' }}
            />
            <div style={{
              position:'absolute',bottom:0,left:0,right:0,
              background:'rgba(0,0,0,0.65)',padding:'4px 6px',
              fontSize:10,color:'#fff',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'
            }}>{img.file_name}</div>
            {canDelete && (
              <button
                onClick={e => { e.stopPropagation(); deleteImage(img) }}
                style={{
                  position:'absolute',top:4,right:4,background:'rgba(0,0,0,0.7)',
                  border:'none',borderRadius:'50%',width:22,height:22,cursor:'pointer',
                  display:'flex',alignItems:'center',justifyContent:'center',color:'#fff'
                }}
                title="Remove image"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="10" height="10"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {images.length < 2 && (
        <label style={{
          display:'inline-flex',alignItems:'center',gap:8,padding:'8px 14px',
          border:'1px dashed var(--border-strong)',borderRadius:'var(--radius)',
          cursor: uploading ? 'wait' : 'pointer',fontSize:13,color:'var(--text-2)',
          background:'var(--bg-input)',transition:'all 0.15s'
        }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="15" height="15"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
          {uploading ? 'Uploading...' : `Add photo (${2 - images.length} remaining)`}
          <input type="file" accept="image/*" multiple onChange={handleFiles} disabled={uploading} style={{ display:'none' }} />
        </label>
      )}
    </div>
  )
}
