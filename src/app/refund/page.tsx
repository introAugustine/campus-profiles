export default function RefundPage() {
  return (
    <div className="min-h-screen bg-blue-50 px-6 py-16">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-3xl font-extrabold text-blue-950 mb-6">Refund Policy</h1>
        <div className="space-y-4 text-gray-700 text-sm leading-relaxed">
          <p>If your profile is reviewed and rejected (for example, due to inappropriate content or unclear photos), you are eligible for a full refund of your $8 payment.</p>
          <p>To request a refund after a rejection, contact us with the payment method and details you used, and we will process it manually.</p>
          <p>Once a profile has been approved and posted, the $8 payment is non-refundable, since the service (featuring your profile) has been delivered.</p>
          <p>Refunds are processed back through the same payment method you originally used (Venmo, Cash App, Zelle/Apple Pay, or PayPal).</p>
        </div>
      </div>
    </div>
  )
}