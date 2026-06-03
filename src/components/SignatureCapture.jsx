import { useRef, useState, useEffect } from 'react'

export default function SignatureCapture({ onSave, onCancel, existingSignature }) {
  const canvasRef = useRef(null)
  const [drawing, setDrawing] = useState(false)
  const [hasStrokes, setHasStrokes] = useState(false)
  const [signedName, setSignedName] = useState('')
  const lastPos = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.strokeStyle = '#f0efe8'
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    if (existingSignature) {
      const img = new Image()
      img.onload = () => ctx.drawImage(img, 0, 0)
      img.src = existingSignature
      setHasStrokes(true)
    }
  }, [])

  function getPos(e, canvas) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    }
  }

  function startDraw(e) {
    e.preventDefault()
    const canvas = canvasRef.current
    setDrawing(true)
    setHasStrokes(true)
    lastPos.current = getPos(e, canvas)
  }

  function draw(e) {
    e.preventDefault()
    if (!drawing) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e, canvas)
    ctx.beginPath()
    ctx.moveTo(lastPos.current.x, lastPos.current.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    lastPos.current = pos
  }

  function endDraw(e) {
    e?.preventDefault()
    setDrawing(false)
    lastPos.current = null
  }

  function clear() {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasStrokes(false)
  }

  function save() {
    if (!hasStrokes) return
    const dataUrl = canvasRef.current.toDataURL('image/png')
    onSave({ dataUrl, signedName })
  }

  return (
    <div style={{ background:'var(--bg-elevated)',border:'1px solid var(--border-strong)',borderRadius:'var(--radius-lg)',padding:20 }}>
      <div style={{ fontSize:13,fontWeight:600,color:'var(--text-2)',marginBottom:12,textTransform:'uppercase',letterSpacing:'0.04em' }}>Customer signature</div>

      <div style={{ marginBottom:12 }}>
        <label className="form-label" style={{ marginBottom:6,display:'block' }}>Customer printed name</label>
        <input
          className="form-input"
          value={signedName}
          onChange={e => setSignedName(e.target.value)}
          placeholder="Full name"
          style={{ maxWidth:320 }}
        />
      </div>

      <div style={{ position:'relative',marginBottom:12 }}>
        <div style={{
          position:'absolute',top:'50%',left:'50%',transform:'translate(-50%,-50%)',
          fontSize:13,color:'var(--text-3)',pointerEvents:'none',userSelect:'none',
          opacity: hasStrokes ? 0 : 1, transition:'opacity 0.2s'
        }}>Sign here</div>
        <canvas
          ref={canvasRef}
          width={600}
          height={180}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          style={{
            width:'100%',height:180,background:'var(--bg-input)',
            borderRadius:'var(--radius)',border:'1px solid var(--border-strong)',
            cursor:'crosshair',display:'block',touchAction:'none'
          }}
        />
      </div>

      <div style={{ display:'flex',gap:8,flexWrap:'wrap' }}>
        <button
          className="btn btn-primary"
          onClick={save}
          disabled={!hasStrokes}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M20 6L9 17l-5-5"/></svg>
          Save signature
        </button>
        <button className="btn" onClick={clear}>Clear</button>
        {onCancel && <button className="btn" onClick={onCancel}>Cancel</button>}
      </div>
      <div style={{ fontSize:11,color:'var(--text-3)',marginTop:10 }}>
        By signing above, the customer acknowledges all items listed in this due bill as promised by the dealership.
      </div>
    </div>
  )
}
