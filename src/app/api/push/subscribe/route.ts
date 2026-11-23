import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
  if (userError || !user) {
    return NextResponse.json({ error: 'Not signed in' }, { status: 401 })
  }

  const { data: admin } = await supabaseAdmin
    .from('admins')
    .select('id, status')
    .eq('id', user.id)
    .single()

  if (!admin || admin.status !== 'active') {
    return NextResponse.json({ error: 'Not an active admin' }, { status: 403 })
  }

  const { subscription } = await request.json()
  const endpoint = subscription?.endpoint
  const p256dh = subscription?.keys?.p256dh
  const auth = subscription?.keys?.auth

  if (!endpoint || !p256dh || !auth) {
    return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('push_subscriptions')
    .upsert({ admin_id: user.id, endpoint, p256dh, auth }, { onConflict: 'endpoint' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}