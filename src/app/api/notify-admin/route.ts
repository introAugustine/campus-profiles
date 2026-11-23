import { Resend } from 'resend'
import * as webpush from 'web-push'
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

async function sendPush(
  supabaseAdmin: SupabaseClient,
  igHandle: string,
  adminRef: string | null
) {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const privateKey = process.env.VAPID_PRIVATE_KEY
  const subject = process.env.VAPID_SUBJECT
  if (!publicKey || !privateKey || !subject) return 0

  webpush.setVapidDetails(subject, publicKey, privateKey)

  // Main admin always gets it; so does the admin whose link was used
  const recipientIds = new Set<string>()

  const { data: mains } = await supabaseAdmin
    .from('admins')
    .select('id')
    .eq('role', 'main')
    .eq('status', 'active')
  mains?.forEach((a) => recipientIds.add(a.id))

  if (adminRef) {
    const { data: owners } = await supabaseAdmin
      .from('admins')
      .select('id')
      .eq('ref_code', adminRef)
      .eq('status', 'active')
    owners?.forEach((a) => recipientIds.add(a.id))
  }

  if (recipientIds.size === 0) return 0

  const { data: subs } = await supabaseAdmin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .in('admin_id', Array.from(recipientIds))

  if (!subs || subs.length === 0) return 0

  const payload = JSON.stringify({
    title: 'New submission ready for review',
    body: `${String(igHandle).slice(0, 60)}${adminRef ? ` · via ${adminRef}` : ''}`,
    url: '/admin/dashboard',
  })

  let sent = 0
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
          { urgency: 'high', TTL: 3600 }
        )
        sent++
      } catch (err: any) {
        // Phone uninstalled the app or revoked permission: clean it up
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await supabaseAdmin.from('push_subscriptions').delete().eq('id', s.id)
        }
      }
    })
  )

  return sent
}

export async function POST(request: NextRequest) {
  const { igHandle, adminRef } = await request.json()

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: mainAdmin } = await supabaseAdmin
    .from('admins')
    .select('email')
    .eq('role', 'main')
    .single()

  let emailSent = false
  if (mainAdmin?.email) {
    try {
      await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: mainAdmin.email,
        subject: `New submission ready for review — ${igHandle}`,
        html: `
          <p>A new profile just completed payment and is ready for review.</p>
          <p><strong>Instagram:</strong> ${igHandle}</p>
          <p><strong>Via admin link:</strong> ${adminRef || 'direct (no admin link)'}</p>
          <p><a href="https://campus-profiles.vercel.app/admin/dashboard">Go to Dashboard</a></p>
        `,
      })
      emailSent = true
    } catch {}
  }

  let pushSent = 0
  try {
    pushSent = await sendPush(supabaseAdmin, igHandle, adminRef || null)
  } catch {}

  return NextResponse.json({ success: true, emailSent, pushSent })
}