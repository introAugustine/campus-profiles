import LegalPage from '@/components/LegalPage'

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      paragraphs={[
        'By submitting a profile, you confirm the photos, bio, and Instagram handle you provide are your own and accurate.',
        'Submissions containing inappropriate, offensive, or misleading content will be rejected. See our Refund Policy for what happens in that case.',
        'Payment is made manually through the payment method you select, and proof of payment must be uploaded for your submission to be reviewed.',
        'We reserve the right to remove any posted profile at any time if it violates these terms or is reported by another user.',
        'This platform is intended to help incoming students connect before the semester starts. Any misuse, harassment, or impersonation using submitted profiles is not permitted.',
      ]}
    />
  )
}