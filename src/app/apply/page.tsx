'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import StepProgress from '@/components/StepProgress'
import PublicHeader from '@/components/PublicHeader'
import Icon, { type IconName } from '@/components/Icon'

const inputClass =
  'block w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500'

function Section({
  icon,
  title,
  children,
}: {
  icon: IconName
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-9 w-9 rounded-full bg-blue-500/15 text-blue-300 flex items-center justify-center shrink-0">
          <Icon name={icon} />
        </div>
        <h2 className="font-bold">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function ApplyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const adminRef = searchParams.get('ref') || null

  const [photos, setPhotos] = useState<File[]>([])
  const [schoolName, setSchoolName] = useState('')
  const [bio, setBio] = useState('')
  const [igHandle, setIgHandle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Fills the progress bar as each part of the form is completed
  const completed = [
    schoolName.trim().length > 0,
    bio.trim().length > 0,
    igHandle.trim().length > 0,
    photos.length > 0,
  ].filter(Boolean).length
  const stepProgress = completed / 4

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 10) {
      setError('You can upload a maximum of 10 photos.')
      return
    }
    setError('')
    setPhotos(files)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!schoolName.trim()) {
      setError('Please enter your school name.')
      return
    }
    if (photos.length === 0) {
      setError('Please upload at least 1 photo.')
      return
    }
    if (!bio.trim()) {
      setError('Please write a short bio.')
      return
    }
    if (!igHandle.trim()) {
      setError('Please enter your Instagram handle.')
      return
    }

    setLoading(true)
    const supabase = createClient()

    try {
      const photoUrls: string[] = []

      for (const photo of photos) {
        const fileExt = photo.name.split('.').pop()
        const fileName = `${crypto.randomUUID()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('student-photos')
          .upload(fileName, photo)

        if (uploadError) throw uploadError

        const { data } = supabase.storage
          .from('student-photos')
          .getPublicUrl(fileName)

        photoUrls.push(data.publicUrl)
      }

      const { data: submission, error: insertError } = await supabase
        .from('submissions')
        .insert({
          school_name: schoolName.trim(),
          bio,
          ig_handle: igHandle,
          photo_urls: photoUrls,
          admin_ref: adminRef,
          status: 'pending_payment',
        })
        .select()
        .single()

      if (insertError) throw insertError

      router.push(`/payment/${submission.id}`)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <PublicHeader />

      <div className="max-w-2xl mx-auto px-3 py-4">
        <div className="mb-4">
          <h1 className="text-2xl font-extrabold">Submit Your Profile</h1>
          <p className="text-sm text-slate-400">Fill this out to get featured, takes 2 minutes.</p>
        </div>

        <StepProgress currentStep={1} stepProgress={stepProgress} />

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Section icon="school" title="School Name">
              <input
                type="text"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className={inputClass}
                placeholder="e.g. Prairie View A&M University"
              />
            </Section>

            <Section icon="user" title="Your Bio">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                className={inputClass}
                placeholder="Tell students about yourself..."
              />
            </Section>
          </div>

          <Section icon="camera" title="Instagram Handle">
            <input
              type="text"
              value={igHandle}
              onChange={(e) => setIgHandle(e.target.value)}
              className={inputClass}
              placeholder="@yourusername"
            />
          </Section>

          <Section icon="photo" title="Upload Your Photos">
            <p className="text-sm text-slate-400 mb-3">Add up to 10 clear photos for your profile.</p>
            <label className="block border-2 border-dashed border-blue-500/60 hover:border-blue-400 rounded-xl p-5 text-center bg-slate-800/40 cursor-pointer transition">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="hidden"
              />
              <div className="flex justify-center text-blue-300 mb-1">
                <Icon name="camera" className="h-8 w-8" />
              </div>
              <p className="text-blue-300 font-bold">Select Photos</p>
              <p className="text-slate-400 text-sm mt-1">{photos.length}/10 uploaded</p>
            </label>
          </Section>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-9 w-9 rounded-full bg-blue-500/15 text-blue-300 flex items-center justify-center shrink-0">
                  <Icon name="eye" />
                </div>
                <h2 className="font-bold">Profile Preview</h2>
              </div>
              <div className="space-y-1.5 text-sm">
                <p className="text-slate-400">
                  School: <span className="font-semibold text-slate-100">{schoolName || 'Your school'}</span>
                </p>
                <p className="text-slate-400">
                  Instagram: <span className="font-semibold text-slate-100">{igHandle || 'Your username'}</span>
                </p>
                <p className="text-slate-400 line-clamp-3">
                  Bio: <span className="text-slate-200">{bio || 'Your introduction will appear here'}</span>
                </p>
              </div>
            </div>

            <div className="bg-blue-600 rounded-2xl p-4">
              <h2 className="font-bold mb-3">What Happens Next?</h2>
              <ul className="space-y-2 text-sm">
                {[
                  'Submit your profile',
                  'Complete $8 payment',
                  'We review and prepare your feature',
                  'Your profile goes live soon',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2">
                    <span className="h-5 w-5 rounded-md bg-green-500 flex items-center justify-center shrink-0">
                      <Icon name="check" className="h-3.5 w-3.5 text-white" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 transition"
          >
            {loading ? 'Submitting...' : 'Continue to Payment'}
            {!loading && <Icon name="arrowRight" />}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-400 p-6">Loading...</div>}>
      <ApplyForm />
    </Suspense>
  )
}