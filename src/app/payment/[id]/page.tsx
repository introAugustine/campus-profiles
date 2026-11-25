'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import StepProgress from '@/components/StepProgress'
import PublicHeader from '@/components/PublicHeader'
import Icon from '@/components/Icon'

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
  const [copiedId, setCopiedId] = useState<string | null>(null)

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

  const copyDetails = async (id: string, details: string) => {
    await navigator.clipboard.writeText(details)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 1500)
  }

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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <p className="text-slate-400">Loading payment options...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <PublicHeader />

      <div className="max-w-xl mx-auto px-3 py-4">
        <h1 className="text-2xl font-extrabold">Pay $8 to Continue</h1>
        <p className="text-sm text-slate-400 mb-4">Choose a payment method below, then send $8.</p>

        <StepProgress currentStep={2} stepProgress={selectedId ? 0.5 : 0} />

        <div className="space-y-2.5 mb-4">
          {options.map((opt) => {
            const selected = selectedId === opt.id
            return (
              <div
                key={opt.id}
                className={`rounded-2xl border p-3 transition flex items-center gap-2 ${
                  selected
                    ? 'bg-blue-500/10 border-blue-500'
                    : 'bg-slate-900 border-slate-800'
                }`}
              >
                <label className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer">
                  <input
                    type="radio"
                    name="payment"
                    checked={selected}
                    onChange={() => setSelectedId(opt.id)}
                    className="h-4 w-4 accent-blue-500 shrink-0"
                  />
                  <div className="h-10 w-10 rounded-xl bg-blue-600 text-white font-extrabold flex items-center justify-center shrink-0">
                    {opt.label.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold leading-tight">{opt.label}</p>
                    <p className="text-sm text-slate-400 break-all whitespace-pre-line">{opt.details}</p>
                  </div>
                </label>
                <button
                  type="button"
                  onClick={() => copyDetails(opt.id, opt.details)}
                  className="shrink-0 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-100 transition"
                >
                  <Icon name={copiedId === opt.id ? 'check' : 'copy'} className="h-3.5 w-3.5" />
                  {copiedId === opt.id ? 'Copied' : 'Copy'}
                </button>
              </div>
            )
          })}
        </div>

        {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

        <button
          onClick={handleContinue}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-yellow-400 hover:bg-yellow-300 text-blue-950 py-4 rounded-xl font-bold text-lg disabled:opacity-50 transition"
        >
          {saving ? 'Saving...' : "I've Made Payment, Continue"}
          {!saving && <Icon name="arrowRight" />}
        </button>
      </div>
    </div>
  )
}