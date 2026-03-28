// FILE: src/app/(public)/refund/page.tsx

import {
  LegalPageLayout,
  LegalSection,
  LegalList,
  LegalContact,
} from '@/components/marketing/LegalPageLayout'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Refund & Cancellation Policy',
  description:
    'Refund and cancellation policy for VidyaFlow subscriptions by Shivshakti Computer Academy.',
  alternates: { canonical: '/refund' },
}

export default function RefundPage() {
  return (
    <LegalPageLayout
      eyebrow="✦ Refund & Cancellation"
      title="Refund & Cancellation Policy"
      lastUpdated="January 2025"
    >
      <LegalSection number="01" title="Free Trial">
        <p>
          The free trial does not require any payment. No refund is applicable for trial usage. When the
          trial expires, your account is restricted to the subscription page. Your data remains intact.
        </p>
      </LegalSection>

      <LegalSection number="02" title="Subscription Cancellation">
        <LegalList
          items={[
            'You may cancel your subscription at any time from the admin panel.',
            'Upon cancellation, your current billing period continues until its end date. Features remain accessible until then.',
            'After the billing period ends, all features are blocked and the account moves to "Expired" state.',
            'Your data is retained for 90 days after expiry. You can reactivate by subscribing again.',
          ]}
        />
      </LegalSection>

      <LegalSection number="03" title="Refund Policy">
        {/* Monthly */}
        <div className="card-dark p-4 border-l-2 border-amber-500/40">
          <p className="text-sm font-semibold text-amber-400 mb-1">Monthly Plans</p>
          <p className="text-[13px] text-slate-400">
            Monthly subscriptions are <strong className="text-slate-300">non-refundable</strong>. You may
            cancel at any time, but the current month&apos;s payment will not be refunded. Your access
            continues until the end of the billing period.
          </p>
        </div>

        {/* Yearly */}
        <div className="card-dark p-4 border-l-2 border-emerald-500/40">
          <p className="text-sm font-semibold text-emerald-400 mb-1">Yearly Plans</p>
          <p className="text-[13px] text-slate-400">
            For yearly subscriptions, a <strong className="text-slate-300">pro-rata refund</strong> may be
            issued if cancellation is requested within the first 30 days of purchase. After 30 days, yearly
            plans are non-refundable. Contact support to request a refund.
          </p>
        </div>
      </LegalSection>

      <LegalSection number="04" title="How to Request a Refund">
        <p>To request a refund, contact us with the following details:</p>
        <LegalList
          items={[
            'School name and school code',
            'Registered phone number or email',
            'Reason for cancellation/refund',
            'Payment transaction ID (from Razorpay receipt)',
          ]}
        />
        <p>
          Send this to{' '}
          <a href="mailto:support@vidyaflow.in" className="text-brand-400 hover:underline">
            support@vidyaflow.in
          </a>{' '}
          or contact us via WhatsApp.
        </p>
      </LegalSection>

      <LegalSection number="05" title="Refund Processing">
        <LegalList
          items={[
            'Approved refunds are processed within 7–10 business days.',
            'Refunds are credited back to the original payment method.',
            'Processing time may vary depending on your bank/payment provider.',
          ]}
        />
      </LegalSection>

      <LegalSection number="06" title="Plan Downgrade">
        <p>
          Downgrading from a higher plan to a lower plan does not result in a refund for the current
          billing period. The lower plan takes effect from the next billing cycle. Module access is
          adjusted immediately — modules not included in the new plan will be locked.
        </p>
      </LegalSection>

      <LegalSection number="07" title="Exceptions">
        <p>
          In cases of duplicate payment, technical errors preventing access, or billing mistakes on our
          end, we will issue a full refund regardless of the above policies. Contact support immediately
          if you experience any billing issues.
        </p>
      </LegalSection>

      <LegalSection number="08" title="Contact">
        <LegalContact />
      </LegalSection>
    </LegalPageLayout>
  )
}