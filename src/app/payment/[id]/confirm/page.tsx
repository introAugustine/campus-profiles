'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

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

      // Notify main admin by email (don't block success screen if this fails)
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
      <div className="min-h-screen bg-blue-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-sm p-10 text-center">
          <div className="w-16 h-16 rounded-full bg-blue-700 flex items-center justify-center mx-auto mb-6">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-extrabold text-blue-950 mb-3">You're All Set</h1>
          <p className="text-gray-600">
            Your profile is now under review. Once approved and posted, you'll be notified
            on your Instagram handle.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50 px-4 py-8">
      <div className="max-w-lg mx-auto bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-3xl font-extrabold text-blue-950 mb-1">Confirm Your Payment</h1>
        <p className="text-gray-500 mb-6">
          Upload a screenshot showing your $8 payment went through.
        </p>

        <label className="block border-2 border-dashed border-blue-400 rounded-xl p-8 text-center bg-blue-50 cursor-pointer mb-6">
          <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          <div className="text-3xl mb-2">🧾</div>
          <p className="text-blue-700 font-bold">
            {screenshot ? screenshot.name : 'Select Screenshot'}
          </p>
        </label>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-yellow-400 hover:bg-yellow-300 text-blue-950 py-4 rounded-xl font-bold text-lg disabled:opacity-50 transition"
        >
          {loading ? 'Uploading...' : 'Submit Payment Proof'}
        </button>
      </div>
    </div>
  )
}