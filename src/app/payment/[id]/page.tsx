'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

type PaymentOption = {
  id: string
  label: string
  details: string
}

export default function PaymentPage() {
  const router = useRouter()
  const params = useParams()
  const submissionId = params.id as string

  const [options, setOptions] = useState<PaymentOption[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchOptions = async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('payment_options')
        .select('id, label, details')
        .eq('active', true)

      if (error) {
        setError('Could not load payment options.')
      } else {
        setOptions(data || [])
      }
      setLoading(false)
    }
    fetchOptions()
  }, [])

  const handleContinue = async () => {
    if (!selectedId) {
      setError('Please select a payment option.')
      return
    }
    setSaving(true)
    setError('')

    const supabase = createClient()
    const { error: updateError } = await supabase
      .from('submissions')
      .update({ payment_option_id: selectedId })
      .eq('id', submissionId)

    if (updateError) {
      setError(updateError.message)
      setSaving(false)
      return
    }

    router.push(`/payment/${submissionId}/confirm`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-50 flex items-center justify-center">
        <p className="text-gray-500">Loading payment options...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-blue-50 px-4 py-8">
      <div className="max-w-lg mx-auto">
        <h1 className="text-3xl font-extrabold text-blue-950 mb-1">Pay $8 to Continue</h1>
        <p className="text-gray-500 mb-6">Choose a payment method below, then send $8.</p>

        <div className="space-y-3 mb-6">
          {options.map((opt) => (
            <label
              key={opt.id}
              className={`block bg-white rounded-2xl p-5 cursor-pointer shadow-sm border-2 transition ${
                selectedId === opt.id ? 'border-blue-600' : 'border-transparent'
              }`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="payment"
                  checked={selectedId === opt.id}
                  onChange={() => setSelectedId(opt.id)}
                  className="mt-1 accent-blue-600"
                />
                <div>
                  <p className="font-bold text-lg">{opt.label}</p>
                  <p className="text-sm text-gray-600 whitespace-pre-line">{opt.details}</p>
                </div>
              </div>
            </label>
          ))}
        </div>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

        <button
          onClick={handleContinue}
          disabled={saving}
          className="w-full bg-yellow-400 hover:bg-yellow-300 text-blue-950 py-4 rounded-xl font-bold text-lg disabled:opacity-50 transition"
        >
          {saving ? 'Saving...' : "I've Made Payment — Continue"}
        </button>
      </div>
    </div>
  )
}