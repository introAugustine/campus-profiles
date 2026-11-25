import LegalPage from '@/components/LegalPage'

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      paragraphs={[
        'We collect the information you submit directly: your photos, bio, Instagram handle, and a screenshot of your payment as proof of payment.',
        'This information is used only to review, feature, and post your profile for other incoming students to see. Your payment screenshot is used solely to confirm payment and is not shared publicly.',
        'We do not sell your information to third parties. Your submitted photos and bio may be publicly visible once your profile is approved and posted, since that is the purpose of the platform.',
        'Your data is stored securely using Supabase, our database and storage provider.',
        "If you'd like your submitted information removed at any time, contact us and we will delete it.",
      ]}
    />
  )
}