import emailjs from '@emailjs/browser'

let initialized = false

function init(publicKey) {
  if (!initialized && publicKey) {
    emailjs.init(publicKey)
    initialized = true
  }
}

export async function sendManagerApprovalEmail({ settings, dueBill, items, submitterName }) {
  init(settings.emailjs_public_key)
  if (!settings.emailjs_service_id || !settings.emailjs_manager_template || !settings.manager_email) return

  const itemsList = items.map(i =>
    `• ${i.bucket_name}: ${i.description} — $${Number(i.estimated_price).toFixed(2)} (${i.is_internal ? 'Internal' : 'External'})`
  ).join('\n')

  const subtotal = items.reduce((s, i) => s + Number(i.estimated_price), 0)
  const taxable = items.filter(i => !i.is_internal).reduce((s, i) => s + Number(i.estimated_price), 0)
  const tax = taxable * (dueBill.tax_rate || 0)
  const total = subtotal + tax

  await emailjs.send(settings.emailjs_service_id, settings.emailjs_manager_template, {
    to_email: settings.manager_email,
    to_name: 'Manager',
    dealer_name: settings.dealer_name || 'Dealership',
    bill_number: dueBill.bill_number,
    submitted_by: submitterName,
    customer_name: dueBill.customer_name,
    vehicle: `${dueBill.vehicle_year} ${dueBill.vehicle_make} ${dueBill.vehicle_model}`,
    vin: dueBill.vehicle_vin || '—',
    items_list: itemsList,
    subtotal: `$${subtotal.toFixed(2)}`,
    tax_amount: `$${tax.toFixed(2)}`,
    total: `$${total.toFixed(2)}`,
    approval_link: `${window.location.origin}/bills/${dueBill.id}`,
    notes: dueBill.notes || 'None'
  })
}

export async function sendVendorNotificationEmail({ settings, dueBill, item, vendorEmail, vendorName }) {
  init(settings.emailjs_public_key)
  if (!settings.emailjs_service_id || !settings.emailjs_vendor_template || !vendorEmail) return

  await emailjs.send(settings.emailjs_service_id, settings.emailjs_vendor_template, {
    to_email: vendorEmail,
    to_name: vendorName,
    dealer_name: settings.dealer_name || 'Dealership',
    bill_number: dueBill.bill_number,
    customer_name: dueBill.customer_name,
    vehicle: `${dueBill.vehicle_year} ${dueBill.vehicle_make} ${dueBill.vehicle_model}`,
    vin: dueBill.vehicle_vin || '—',
    vehicle_color: dueBill.vehicle_color || '—',
    job_description: item.description,
    bucket: item.bucket_name,
    estimated_price: `$${Number(item.estimated_price).toFixed(2)}`,
    notes: item.notes || 'None',
    portal_link: `${window.location.origin}/vendor`
  })
}
