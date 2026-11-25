'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import StepProgress from '@/components/StepProgress'
import PublicHeader from '@/components/PublicHeader'
import Icon from '@/components/Icon'

export default function ConfirmPage() {
  const params = useParams()
  const submissionId = params.id as string

  const [screenshot, setScreenshot] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScreenshot(e.target.files?.[0] || null)
  }

  const handleSubmit = async () => {
    if (!screenshot) {
      setError('Please upload a screenshot of your payment.')
      return
    }
    setLoading(true)
    setError('')

    const supabase = createClient()

    try {
      const fileExt = screenshot.name.split('.').pop()
      const fileName = `${crypto.randomUUID()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('payment-screenshots')
        .upload(fileName, screenshot)

      if (uploadError) throw uploadError

      const { data } = supabase.storage
        .from('payment-screenshots')
        .getPublicUrl(fileName)

      const { data: updatedSubmission, error: updateError } = await supabase
        .from('submissions')
        .update({
          payment_screenshot_url: data.publicUrl,
          status: 'under_review',
        })
        .eq('id', submissionId)
        .select('ig_handle, admin_ref')
        .single()

      if (updateError) throw updateError

      // Notify admins (email + phone). Don't block the success screen if this fails.
      fetch('/api/notify-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          igHandle: updatedSubmission.ig_handle,
          adminRef: updatedSubmission.admin_ref,
        }),
      }).catch(() => {})

      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <PublicHeader />
        <div className="max-w-md mx-auto px-3 py-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl px-4 pt-4">
            <StepProgress currentStep={4} />
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center">
            <div className="mx-auto mb-5 h-24 w-24 rounded-full bg-blue-500/10 flex items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-blue-600 flex items-center justify-center">
                <Icon name="check" className="h-9 w-9 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold mb-3">You&apos;re All Set</h1>
            <p className="text-slate-400">
              Your profile is now under review. Once approved and posted, you&apos;ll be notified
              on your Instagram handle.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <PublicHeader />

      <div className="max-w-xl mx-auto px-3 py-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-500/15 text-blue-300 flex items-center justify-center shrink-0">
              <Icon name="card" className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold leading-tight">Confirm Your Payment</h1>
              <p className="text-sm text-slate-400">
                Upload a screenshot showing your $8 payment went through.
              </p>
            </div>
          </div>

          <StepProgress currentStep={3} stepProgress={screenshot ? 0.5 : 0} />

          <label className="block border-2 border-dashed border-blue-500/60 hover:border-blue-400 rounded-xl p-6 text-center bg-slate-800/40 cursor-pointer transition mb-4">
            <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
            <div className="flex justify-center text-blue-300 mb-2">
              <Icon name={screenshot ? 'check' : 'document'} className="h-10 w-10" />
            </div>
            <p className="text-blue-300 font-bold break-all">
              {screenshot ? screenshot.name : 'Select Screenshot'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {screenshot ? 'Tap to choose a different file' : 'Upload a clear screenshot of your $8 payment'}
            </p>
          </label>

          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-blue-950 py-4 rounded-xl font-bold text-lg disabled:opacity-50 transition"
          >
            {!loading && <Icon name="send" />}
            {loading ? 'Uploading...' : 'Submit Payment Proof'}
          </button>
        </div>
      </div>
    </div>
  )
}