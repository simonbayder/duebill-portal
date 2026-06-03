import { useRef } from 'react'
import { format } from 'date-fns'

export default function PrintableDueBill({ bill, items, signature, dealerName, isCustomerView = false }) {
  const printRef = useRef(null)

  function handlePrint() {
    const content = printRef.current.innerHTML
    const win = window.open('', '_blank', 'width=900,height=700')
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Due Bill ${bill.bill_number}</title>
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />
        <style>
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'DM Sans', sans-serif; color: #111; background: #fff; padding: 48px; font-size: 13px; line-height: 1.5; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 20px; margin-bottom: 28px; }
          .dealer { font-size: 22px; font-weight: 600; letter-spacing: -0.02em; }
          .bill-meta { text-align: right; }
          .bill-number { font-family: 'DM Mono', monospace; font-size: 16px; font-weight: 500; }
          .bill-date { font-size: 12px; color: #666; margin-top: 4px; }
          .legal-banner { background: #f5f5f0; border-left: 4px solid #111; padding: 10px 14px; font-size: 12px; margin-bottom: 24px; }
          .section-title { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; color: #888; margin-bottom: 10px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
          .info-block { }
          .info-label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; color: #999; margin-bottom: 3px; }
          .info-value { font-size: 14px; font-weight: 500; }
          .info-sub { font-size: 12px; color: #555; margin-top: 1px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          thead th { background: #111; color: #fff; padding: 8px 10px; font-size: 11px; font-weight: 600; text-align: left; text-transform: uppercase; letter-spacing: 0.04em; }
          tbody td { padding: 10px; border-bottom: 1px solid #e5e5e5; font-size: 13px; vertical-align: top; }
          tbody tr:last-child td { border-bottom: none; }
          .bucket-tag { display: inline-block; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #888; }
          .type-badge { display: inline-block; font-size: 10px; padding: 2px 7px; border-radius: 12px; font-weight: 600; }
          .internal-badge { background: #e8f0fb; color: #1a5fa5; }
          .external-badge { background: #f0e8fb; color: #6a3fb5; }
          .totals { margin-left: auto; width: 260px; }
          .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; border-bottom: 1px solid #eee; }
          .total-row.final { font-weight: 600; font-size: 15px; border-bottom: 2px solid #111; padding-top: 8px; }
          .mono { font-family: 'DM Mono', monospace; }
          .sig-section { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 24px; }
          .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 16px; }
          .sig-box { }
          .sig-line { border-top: 1px solid #999; margin-top: 60px; margin-bottom: 6px; }
          .sig-label { font-size: 11px; color: #666; }
          .sig-img { max-width: 100%; height: 80px; margin-top: 8px; }
          .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #aaa; text-align: center; }
          .internal-note { font-size: 11px; color: #e05; font-style: italic; }
          @media print {
            body { padding: 24px; }
            @page { margin: 0.5in; size: letter; }
          }
        </style>
      </head>
      <body>
        ${content}
        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `)
    win.document.close()
  }

  const subtotal = items.reduce((s, i) => s + Number(isCustomerView ? (i.sold_price || 0) : (i.sold_price || 0)), 0)
  const taxableAmount = items.filter(i => !i.is_internal).reduce((s, i) => s + Number(i.sold_price || 0), 0)
  const taxAmount = taxableAmount * Number(bill.tax_rate || 0)
  const total = subtotal + taxAmount

  const internalTotals = !isCustomerView ? {
    totalCost: items.reduce((s, i) => s + Number(i.cost_price || 0), 0),
    totalSold: items.reduce((s, i) => s + Number(i.sold_price || 0), 0),
    get margin() { return this.totalSold - this.totalCost }
  } : null

  const PrintContent = () => (
    <div ref={printRef}>
      <div className="header">
        <div>
          <div className="dealer">{dealerName || 'Dealership'}</div>
          <div style={{ fontSize:12,color:'#666',marginTop:3 }}>Due Bill / We Owe Document</div>
        </div>
        <div className="bill-meta">
          <div className="bill-number">{bill.bill_number}</div>
          <div className="bill-date">Created {bill.created_at ? format(new Date(bill.created_at), 'MMMM d, yyyy') : ''}</div>
          <div className="bill-date" style={{ marginTop:4 }}>
            <span style={{ display:'inline-block',padding:'2px 8px',background:'#111',color:'#fff',borderRadius:12,fontSize:11,fontWeight:600 }}>
              {bill.status.replace(/_/g,' ').toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      <div className="legal-banner">
        This Due Bill is a legally binding document confirming the dealership's commitment to provide the items and services listed below.
        Both parties acknowledge these obligations at the time of vehicle purchase.
      </div>

      <div className="info-grid">
        <div>
          <div className="section-title">Customer</div>
          <div className="info-value">{bill.customer_name}</div>
          {bill.customer_email && <div className="info-sub">{bill.customer_email}</div>}
          {bill.customer_phone && <div className="info-sub">{bill.customer_phone}</div>}
          {bill.customer_address && <div className="info-sub" style={{ marginTop:4 }}>{bill.customer_address}<br/>{bill.customer_city}, {bill.customer_state} {bill.customer_zip}</div>}
        </div>
        <div>
          <div className="section-title">Vehicle</div>
          <div className="info-value">{[bill.vehicle_year,bill.vehicle_make,bill.vehicle_model].filter(Boolean).join(' ')}</div>
          {bill.vehicle_color && <div className="info-sub">{bill.vehicle_color}</div>}
          {bill.vehicle_vin && <div className="info-sub mono" style={{ marginTop:4 }}>VIN: {bill.vehicle_vin}</div>}
          {bill.vehicle_stock && <div className="info-sub">Stock #: {bill.vehicle_stock}</div>}
          {bill.sale_date && <div className="info-sub">Sale date: {format(new Date(bill.sale_date), 'MMM d, yyyy')}</div>}
        </div>
      </div>

      <div className="section-title">Promised items &amp; services</div>
      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Description</th>
            <th>Type</th>
            {!isCustomerView && <th style={{ textAlign:'right' }}>Cost</th>}
            <th style={{ textAlign:'right' }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, i) => (
            <tr key={item.id || i}>
              <td><span className="bucket-tag">{item.bucket_name}</span></td>
              <td>
                <div style={{ fontWeight:500 }}>{item.description}</div>
                {item.notes && <div style={{ fontSize:11,color:'#888',marginTop:3 }}>{item.notes}</div>}
              </td>
              <td>
                <span className={`type-badge ${item.is_internal ? 'external-badge' : 'internal-badge'}`}>
                  {item.is_internal ? 'External' : 'Internal'}
                </span>
              </td>
              {!isCustomerView && (
                <td style={{ textAlign:'right',fontFamily:'DM Mono, monospace',fontSize:12 }}>
                  ${Number(item.cost_price||0).toFixed(2)}
                </td>
              )}
              <td style={{ textAlign:'right',fontFamily:'DM Mono, monospace',fontSize:12,fontWeight:500 }}>
                ${Number(item.sold_price||0).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="totals">
        <div className="total-row"><span>Subtotal</span><span className="mono">${subtotal.toFixed(2)}</span></div>
        <div className="total-row"><span>Tax ({(Number(bill.tax_rate||0)*100).toFixed(2)}%)</span><span className="mono">${taxAmount.toFixed(2)}</span></div>
        <div className="total-row final"><span>Total</span><span className="mono">${total.toFixed(2)}</span></div>
        {!isCustomerView && internalTotals && (
          <>
            <div className="total-row" style={{ marginTop:8,color:'#888',fontSize:12 }}><span>Total cost</span><span className="mono">${internalTotals.totalCost.toFixed(2)}</span></div>
            <div className="total-row" style={{ color: internalTotals.margin >= 0 ? '#1a7a3a':'#c02' ,fontSize:12 }}><span>Gross margin</span><span className="mono">${internalTotals.margin.toFixed(2)}</span></div>
          </>
        )}
      </div>

      {bill.notes && (
        <div style={{ marginTop:24,padding:'12px 14px',background:'#f8f8f6',borderRadius:6,fontSize:12 }}>
          <div style={{ fontWeight:600,marginBottom:4,fontSize:10,textTransform:'uppercase',letterSpacing:'0.06em',color:'#888' }}>Notes</div>
          {bill.notes}
        </div>
      )}

      <div className="sig-section">
        <div className="section-title">Signatures</div>
        <div className="sig-grid">
          <div className="sig-box">
            {signature ? (
              <img src={signature.signature_data_url} alt="Customer signature" className="sig-img" />
            ) : (
              <div className="sig-line" />
            )}
            <div className="sig-label">
              Customer signature{signature?.signed_by_name ? ` — ${signature.signed_by_name}` : ''}
              {signature?.signed_at && <span style={{ marginLeft:8,color:'#aaa' }}>{format(new Date(signature.signed_at), 'MMM d, yyyy h:mm a')}</span>}
            </div>
          </div>
          <div className="sig-box">
            <div className="sig-line" />
            <div className="sig-label">Dealer representative &amp; date</div>
          </div>
        </div>
      </div>

      <div className="footer">
        {dealerName} · Due Bill {bill.bill_number} · Generated {format(new Date(), 'MMMM d, yyyy')}
        {isCustomerView ? '' : ' · INTERNAL COPY — CONFIDENTIAL'}
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ display:'flex',gap:8,marginBottom:16,flexWrap:'wrap' }}>
        <button className="btn btn-primary" onClick={handlePrint}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/></svg>
          Print / save PDF (customer copy)
        </button>
        {!isCustomerView && (
          <button className="btn" onClick={() => {
            const orig = isCustomerView
            handlePrint()
          }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/></svg>
            Print internal copy (with costs)
          </button>
        )}
      </div>
      <div style={{ display:'none' }}><PrintContent /></div>
    </div>
  )
}
