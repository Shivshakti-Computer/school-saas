import { Container } from '@/components/marketing/Container'
import { SectionTitle } from '@/components/marketing/MiniUI'

export const metadata = {
  title: 'Refund & Cancellation Policy',
  description: 'Refund and cancellation policy for VidyaFlow subscriptions.',
}

export default function RefundPage() {
  return (
    <div className="py-12">
      <Container>
        <SectionTitle
          eyebrow="Legal"
          title="Refund & Cancellation Policy"
          subtitle="Last updated: January 2025"
        />

        <div className="mt-8 max-w-3xl space-y-8">

          <section>
            <h3 className="text-base font-extrabold text-slate-900">1. Free Trial</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              The free trial does not require any payment. No refund is applicable for trial usage. When the 
              trial expires, your account is restricted to the subscription page. Your data remains intact.
            </p>
          </section>

          <section>
            <h3 className="text-base font-extrabold text-slate-900">2. Subscription Cancellation</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
              <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> You may cancel your subscription at any time from the admin panel.</li>
              <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> Upon cancellation, your current billing period continues until its end date. Features remain accessible until then.</li>
              <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> After the billing period ends, all features are blocked and the account moves to "Expired" state.</li>
              <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> Your data is retained for 90 days after expiry. You can reactivate by subscribing again.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-extrabold text-slate-900">3. Refund Policy</h3>
            <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-sm text-amber-800 font-semibold">Monthly Plans</p>
              <p className="mt-1 text-sm text-amber-700">
                Monthly subscriptions are <strong>non-refundable</strong>. You may cancel at any time, but the 
                current month's payment will not be refunded. Your access continues until the end of the 
                billing period.
              </p>
            </div>
            <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-sm text-emerald-800 font-semibold">Yearly Plans</p>
              <p className="mt-1 text-sm text-emerald-700">
                For yearly subscriptions, a <strong>pro-rata refund</strong> may be issued if cancellation is 
                requested within the first 30 days of purchase. After 30 days, yearly plans are non-refundable. 
                Contact support to request a refund.
              </p>
            </div>
          </section>

          <section>
            <h3 className="text-base font-extrabold text-slate-900">4. How to Request a Refund</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              To request a refund, contact us with the following details:
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
              <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> School name and subdomain (school code)</li>
              <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> Registered phone number or email</li>
              <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> Reason for cancellation/refund</li>
              <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> Payment transaction ID (from Razorpay receipt)</li>
            </ul>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Send this to <strong>support@yourdomain.com</strong> or contact us via WhatsApp.
            </p>
          </section>

          <section>
            <h3 className="text-base font-extrabold text-slate-900">5. Refund Processing</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
              <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> Approved refunds are processed within 7–10 business days.</li>
              <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> Refunds are credited back to the original payment method.</li>
              <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> Processing time may vary depending on your bank/payment provider.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-extrabold text-slate-900">6. Plan Downgrade</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Downgrading from a higher plan to a lower plan does not result in a refund for the current 
              billing period. The lower plan takes effect from the next billing cycle. Module access is 
              adjusted immediately — modules not included in the new plan will be locked.
            </p>
          </section>

          <section>
            <h3 className="text-base font-extrabold text-slate-900">7. Exceptions</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              In cases of duplicate payment, technical errors preventing access, or billing mistakes on our 
              end, we will issue a full refund regardless of the above policies. Contact support immediately 
              if you experience any billing issues.
            </p>
          </section>

          <section>
            <h3 className="text-base font-extrabold text-slate-900">8. Contact</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              <strong>Shivshakti Computer Academy</strong><br />
              Ambikapur, Chhattisgarh, India<br />
              Email: support@yourdomain.com<br />
              Phone/WhatsApp: +91-XXXXXXXXXX
            </p>
          </section>

        </div>
      </Container>
    </div>
  )
}