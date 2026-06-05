import { useRef } from 'react'
import { format } from 'date-fns'

export default function PrintableDueBill({ bill, items, signature, dealerName, isCustomerView = false }) {

  function handlePrint(customerCopy) {
    const subtotal = items.reduce((s, i) => s + Number(i.sold_price || 0), 0)
    const taxableAmount = items.filter(i => !i.is_internal).reduce((s, i) => s + Number(i.sold_price || 0), 0)
    const taxAmount = taxableAmount * Number(bill.tax_rate || 0)
    const total = subtotal + taxAmount
    const totalCost = items.reduce((s, i) => s + Number(i.cost_price || 0), 0)
    const margin = subtotal - totalCost

    const itemRows = items.map((item) => `
      <tr>
        <td><span class="bucket-tag">${item.bucket_name || ''}</span></td>
        <td>
          <div style="font-weight:500">${item.description || ''}</div>
          ${item.notes ? `<div style="font-size:11px;color:#888;margin-top:3px">${item.notes}</div>` : ''}
        </td>
        <td><span class="type-badge ${item.is_internal ? 'external-badge' : 'internal-badge'}">${item.is_internal ? 'External' : 'Internal'}</span></td>
        ${!customerCopy ? `<td style="text-align:right;font-family:DM Mono,monospace;font-size:12px">$${Number(item.cost_price||0).toFixed(2)}</td>` : ''}
        <td style="text-align:right;font-family:DM Mono,monospace;font-size:12px;font-weight:500">$${Number(item.sold_price||0).toFixed(2)}</td>
      </tr>
    `).join('')

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
          .info-value { font-size: 14px; font-weight: 500; }
          .info-sub { font-size: 12px; color: #555; margin-top: 1px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          thead th { background: #111; color: #fff; padding: 8px 10px; font-size: 11px; font-weight: 600; text-align: left; text-transform: uppercase; letter-spacing: 0.04em; }
          tbody td { padding: 10px; border-bottom: 1px solid #e5e5e5; font-size: 13px; vertical-align: top; }
          tbody tr:last-child td { border-bottom: none; }
          .bucket-tag { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #888; }
          .type-badge { display: inline-block; font-size: 10px; padding: 2px 7px; border-radius: 12px; font-weight: 600; }
          .internal-badge { background: #e8f0fb; color: #1a5fa5; }
          .external-badge { background: #f0e8fb; color: #6a3fb5; }
          .totals { margin-left: auto; width: 260px; }
          .total-row { display: flex; justify-content: space-between; padding: 5px 0; font-size: 13px; border-bottom: 1px solid #eee; }
          .total-row.final { font-weight: 600; font-size: 15px; border-bottom: 2px solid #111; padding-top: 8px; }
          .mono { font-family: 'DM Mono', monospace; }
          .sig-section { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 24px; }
          .sig-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 16px; }
          .sig-line { border-top: 1px solid #999; margin-top: 60px; margin-bottom: 6px; }
          .sig-label { font-size: 11px; color: #666; }
          .sig-img { max-width: 100%; height: 80px; margin-top: 8px; }
          .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #eee; font-size: 11px; color: #aaa; text-align: center; }
          @media print { body { padding: 24px; } @page { margin: 0.5in; size: letter; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="dealer">${dealerName || 'Dealership'}</div>
            <div style="font-size:12px;color:#666;margin-top:3px">Due Bill / We Owe Document</div>
          </div>
          <div class="bill-meta">
            <div class="bill-number">${bill.bill_number}</div>
            <div class="bill-date">Created ${bill.created_at ? format(new Date(bill.created_at), 'MMMM d, yyyy') : ''}</div>
            <div class="bill-date" style="margin-top:4px">
              <span style="display:inline-block;padding:2px 8px;background:#111;color:#fff;border-radius:12px;font-size:11px;font-weight:600">
                ${bill.status.replace(/_/g,' ').toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        <div class="legal-banner">
          This Due Bill is a legally binding document confirming the dealership's commitment to provide the items and services listed below.
        </div>

        <div class="info-grid">
          <div>
            <div class="section-title">Customer</div>
            <div class="info-value">${bill.customer_name}</div>
            ${bill.deal_number ? `<div class="info-sub">Deal #: ${bill.deal_number}</div>` : ''}
            ${bill.customer_email ? `<div class="info-sub">${bill.customer_email}</div>` : ''}
            ${bill.customer_phone ? `<div class="info-sub">${bill.customer_phone}</div>` : ''}
            ${bill.customer_address ? `<div class="info-sub" style="margin-top:4px">${bill.customer_address}<br/>${bill.customer_city}, ${bill.customer_state} ${bill.customer_zip}</div>` : ''}
          </div>
          <div>
            <div class="section-title">Vehicle</div>
            <div class="info-value">${[bill.vehicle_year,bill.vehicle_make,bill.vehicle_model].filter(Boolean).join(' ')}</div>
            ${bill.vehicle_color ? `<div class="info-sub">${bill.vehicle_color}</div>` : ''}
            ${bill.vehicle_vin ? `<div class="info-sub mono" style="margin-top:4px">VIN: ${bill.vehicle_vin}</div>` : ''}
            ${bill.vehicle_stock ? `<div class="info-sub">Stock #: ${bill.vehicle_stock}</div>` : ''}
            ${bill.sale_date ? `<div class="info-sub">Sale date: ${format(new Date(bill.sale_date), 'MMM d, yyyy')}</div>` : ''}
          </div>
        </div>

        <div class="section-title">Promised items &amp; services</div>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Description</th>
              <th>Type</th>
              ${!customerCopy ? '<th style="text-align:right">Cost</th>' : ''}
              <th style="text-align:right">Amount</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>

        <div class="totals">
          <div class="total-row"><span>Subtotal</span><span class="mono">$${subtotal.toFixed(2)}</span></div>
          <div class="total-row"><span>Tax (${(Number(bill.tax_rate||0)*100).toFixed(2)}%)</span><span class="mono">$${taxAmount.toFixed(2)}</span></div>
          <div class="total-row final"><span>Total</span><span class="mono">$${total.toFixed(2)}</span></div>
          ${!customerCopy ? `
            <div class="total-row" style="margin-top:8px;color:#888;font-size:12px"><span>Total cost</span><span class="mono">$${totalCost.toFixed(2)}</span></div>
            <div class="total-row" style="color:${margin >= 0 ? '#1a7a3a' : '#c02'};font-size:12px"><span>Gross margin</span><span class="mono">$${margin.toFixed(2)}</span></div>
          ` : ''}
        </div>

        ${bill.notes ? `
          <div style="margin-top:24px;padding:12px 14px;background:#f8f8f6;border-radius:6px;font-size:12px">
            <div style="font-weight:600;margin-bottom:4px;font-size:10px;text-transform:uppercase;letter-spacing:0.06em;color:#888">Notes</div>
            ${bill.notes}
          </div>
        ` : ''}

        <div class="sig-section">
          <div class="section-title">Signatures</div>
          <div class="sig-grid">
            <div>
              ${signature ? `<img src="${signature.signature_data_url}" alt="Signature" class="sig-img" />` : '<div class="sig-line"></div>'}
              <div class="sig-label">Customer signature${signature?.signed_by_name ? ` — ${signature.signed_by_name}` : ''}</div>
            </div>
            <div>
              <div class="sig-line"></div>
              <div class="sig-label">Dealer representative &amp; date</div>
            </div>
          </div>
        </div>

        <div class="footer">
          ${dealerName || 'Dealership'} · Due Bill ${bill.bill_number} · Generated ${format(new Date(), 'MMMM d, yyyy')}
          ${!customerCopy ? ' · INTERNAL COPY — CONFIDENTIAL' : ''}
        </div>

        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `)
    win.document.close()
  }

  return (
    <div>
      <div style={{ display:'flex',gap:8,marginBottom:16,flexWrap:'wrap' }}>
        <button className="btn btn-primary" onClick={() => handlePrint(true)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/></svg>
          Print customer copy
        </button>
        {!isCustomerView && (
          <button className="btn" onClick={() => handlePrint(false)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14"><path d="M6 9V2h12v7M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2M6 14h12v8H6z"/></svg>
            Print internal copy (with costs)
          </button>
        )}
      </div>
    </div>
  )
}
