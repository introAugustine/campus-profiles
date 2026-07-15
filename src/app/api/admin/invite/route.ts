import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { email, name, refCode, requesterId } = await request.json()

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Confirm the requester is actually the main admin
  const { data: requester } = await supabaseAdmin
    .from('admins')
    .select('role')
    .eq('id', requesterId)
    .single()

  if (!requester || requester.role !== 'main') {
    return NextResponse.json({ error: 'Not authorized' }, { status: 403 })
  }

  // Invite the new admin by email (sends them a link to set their password)
  const { data: invited, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
    redirectTo: 'http://localhost:3000/admin/set-password',
  })

  if (inviteError || !invited.user) {
    return NextResponse.json({ error: inviteError?.message || 'Invite failed' }, { status: 400 })
  }

  // Add them to the admins table
  const { error: insertError } = await supabaseAdmin.from('admins').insert({
    id: invited.user.id,
    name,
    email,
    ref_code: refCode,
    role: 'sub',
    status: 'active',
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 })
  }

  return NextResponse.json({ success: true })
}