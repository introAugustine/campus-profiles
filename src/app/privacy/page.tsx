export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-blue-50 px-6 py-16">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-3xl font-extrabold text-blue-950 mb-6">Privacy Policy</h1>
        <div className="space-y-4 text-gray-700 text-sm leading-relaxed">
          <p>We collect the information you submit directly: your photos, bio, Instagram handle, and a screenshot of your payment as proof of payment.</p>
          <p>This information is used only to review, feature, and post your profile for other incoming students to see. Your payment screenshot is used solely to confirm payment and is not shared publicly.</p>
          <p>We do not sell your information to third parties. Your submitted photos and bio may be publicly visible once your profile is approved and posted, since that is the purpose of the platform.</p>
          <p>Your data is stored securely using Supabase, our database and storage provider.</p>
          <p>If you'd like your submitted information removed at any time, contact us and we will delete it.</p>
        </div>
      </div>
    </div>
  )
}