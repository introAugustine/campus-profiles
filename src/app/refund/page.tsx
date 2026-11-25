import LegalPage from '@/components/LegalPage'

export default function RefundPage() {
  return (
    <LegalPage
      title="Refund Policy"
      paragraphs={[
        'If your profile is reviewed and rejected (for example, due to inappropriate content or unclear photos), you are eligible for a full refund of your $8 payment.',
        'To request a refund after a rejection, contact us with the payment method and details you used, and we will process it manually.',
        'Once a profile has been approved and posted, the $8 payment is non-refundable, since the service (featuring your profile) has been delivered.',
        'Refunds are processed back through the same payment method you originally used (Venmo, Cash App, Zelle/Apple Pay, or PayPal).',
      ]}
    />
  )
}