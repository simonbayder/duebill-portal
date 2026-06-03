import emailjs from '@emailjs/browser'
import { supabase } from './supabase'

let initialized = false

async function getSettings() {
  const { data } = await supabase.from('settings').select('*').single()
  return data || {}
}

function init(publicKey) {
  if (publicKey && !initialized) {
    emailjs.init(publicKey)
    initialized = true
  }
}

export async function sendManagerApprovalEmail({ dueBill, items, submitterName }) {
  const settings = await getSettings()
  if (!settings.emailjs_public_key || !settings.emailjs_service_id || !settings.emailjs_manager_template || !settings.manager_email) {
    console.warn('EmailJS not configured — skipping manager email')
    return
  }
  init(settings.emailjs_public_key)

  const itemsList = items.map(i =>
    `• ${i.bucket_name}: ${i.description} — $${Number(i.sold_price || 0).toFixed(2)} (${i.is_internal ? 'External' : 'Internal'})`
  ).join('\n')

  const subtotal = items.reduce((s, i) => s + Number(i.sold_price || 0), 0)
  const taxable = items.filter(i => !i.is_internal).reduce((s, i) => s + Number(i.sold_price || 0), 0)
  const tax = taxable * Number(dueBill.tax_rate || 0)
  const total = subtotal + tax

  const result = await emailjs.send(settings.emailjs_service_id, settings.emailjs_manager_template, {
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
  console.log('Manager email sent:', result)
  return result
}

export async function sendVendorNotificationEmail({ dueBill, item, vendorEmail, vendorName }) {
  const settings = await getSettings()
  if (!settings.emailjs_public_key || !settings.emailjs_service_id || !settings.emailjs_vendor_template || !vendorEmail) {
    console.warn('EmailJS not configured or no vendor email — skipping vendor email')
    return
  }
  init(settings.emailjs_public_key)

  const result = await emailjs.send(settings.emailjs_service_id, settings.emailjs_vendor_template, {
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
    estimated_price: `$${Number(item.sold_price || 0).toFixed(2)}`,
    notes: item.notes || 'None',
    portal_link: `${window.location.origin}/vendor`
  })
  console.log('Vendor email sent:', result)
  return result
}
