import { Resend } from 'resend'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const resend = new Resend(process.env.RESEND_API_KEY)

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

  if (!mainAdmin?.email) {
    return NextResponse.json({ error: 'No main admin found' }, { status: 400 })
  }

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

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}