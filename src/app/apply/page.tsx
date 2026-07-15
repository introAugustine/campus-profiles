'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'

function ApplyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const adminRef = searchParams.get('ref') || null

  const [photos, setPhotos] = useState<File[]>([])
  const [bio, setBio] = useState('')
  const [igHandle, setIgHandle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
    <div className="min-h-screen bg-blue-50 px-4 py-8">
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-extrabold text-blue-950 mb-1">Submit Your Profile</h1>
          <p className="text-gray-500">Fill this out to get featured — takes 2 minutes.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Bio */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <label className="block font-bold text-lg mb-3">✍️ Your Bio</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={5}
              className="block w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Tell students about yourself..."
            />
          </div>

          {/* Instagram */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <label className="block font-bold text-lg mb-3">📱 Instagram Handle</label>
            <input
              type="text"
              value={igHandle}
              onChange={(e) => setIgHandle(e.target.value)}
              className="block w-full border border-gray-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="@yourusername"
            />
          </div>

          {/* Photos */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6">
            <label className="block font-bold text-lg mb-1">📸 Upload Your Photos</label>
            <p className="text-gray-600 text-sm mb-4">Add up to 10 clear photos for your profile.</p>

            <label className="block border-2 border-dashed border-blue-400 rounded-xl p-8 text-center bg-white cursor-pointer">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="hidden"
              />
              <div className="text-3xl mb-2">📷</div>
              <p className="text-blue-700 font-bold">Select Photos</p>
              <p className="text-gray-500 text-sm mt-1">{photos.length}/10 uploaded</p>
            </label>
          </div>

          {/* Live preview */}
          <div className="bg-gray-50 rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-4">Profile Preview</h2>
            <div className="space-y-2 text-sm">
              <p>📱 Instagram: <span className="font-semibold">{igHandle || 'Your username'}</span></p>
              <p>✍️ Bio:</p>
              <p className="text-gray-500">{bio || 'Your introduction will appear here'}</p>
            </div>
          </div>

          {/* What happens next */}
          <div className="bg-blue-700 text-white rounded-2xl p-6">
            <h2 className="font-bold text-lg mb-4">What Happens Next?</h2>
            <ul className="space-y-2 text-sm">
              <li>✅ Submit your profile</li>
              <li>✅ Complete payment</li>
              <li>✅ We review and prepare your feature</li>
              <li>✅ Your profile goes live soon</li>
            </ul>
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50 transition"
          >
            {loading ? 'Submitting...' : 'Continue to Payment →'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ApplyPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <ApplyForm />
    </Suspense>
  )
}