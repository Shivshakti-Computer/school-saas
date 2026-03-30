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
    'Refund and cancellation policy for Skolify subscriptions by Shivshakti Computer Academy.',
  alternates: { canonical: '/refund' },
}

export default function RefundPage() {
  return (
    <LegalPageLayout
      eyebrow="💰 Refund Policy"
      title="Refund & Cancellation Policy"
      lastUpdated="January 2025"
    >
      <LegalSection number="01" title="Free Trial Period">
        <p>
          Every new school registration receives a <strong className="text-slate-800">14-day free trial</strong> with
          no payment required. No credit card is needed during the trial period.
        </p>
        <p>
          No refund is applicable for trial usage since no payment is collected. When the trial expires,
          your account is restricted to the subscription page only — your data remains intact and safe.
        </p>
      </LegalSection>

      <LegalSection number="02" title="Subscription Cancellation">
        <p>You may cancel your subscription at any time from the admin panel under Settings → Subscription.</p>
        <LegalList
          items={[
            'Cancellation takes effect at the end of the current billing period',
            'All features remain accessible until the billing period ends',
            'After expiry, features are blocked — account moves to "Expired" state',
            'Your data is safely retained for 90 days after expiry',
            'You can reactivate anytime by choosing a new plan',
            'No cancellation fees or penalties of any kind',
          ]}
        />
      </LegalSection>

      <LegalSection number="03" title="Monthly Plan Refunds">
        {/* Monthly Plan Box */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📅</span>
            <p className="text-sm font-bold text-amber-800">Monthly Billing</p>
          </div>
          <p className="text-sm text-amber-900 leading-relaxed">
            Monthly subscriptions are <strong>non-refundable</strong>. You may cancel at any time,
            but the current month&apos;s payment will not be refunded. Your access continues until
            the end of the current billing period.
          </p>
        </div>
      </LegalSection>

      <LegalSection number="04" title="Yearly Plan Refunds">
        {/* Yearly Plan Box */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">📆</span>
            <p className="text-sm font-bold text-emerald-800">Yearly Billing</p>
          </div>
          <p className="text-sm text-emerald-900 leading-relaxed">
            For yearly subscriptions, a <strong>pro-rata refund</strong> may be issued if
            cancellation is requested within the <strong>first 30 days</strong> of purchase.
            After 30 days, yearly plans are non-refundable. Contact support to request a refund
            within the eligible period.
          </p>
        </div>
      </LegalSection>

      <LegalSection number="05" title="How to Request a Refund">
        <p>To request a refund, contact us with the following details:</p>
        <LegalList
          items={[
            'School name and school code',
            'Registered phone number or email address',
            'Reason for cancellation / refund request',
            'Payment transaction ID (available in your Razorpay receipt)',
          ]}
        />
        <p>
          Send your request to{' '}
          <a href="mailto:support@Skolify.in" className="text-blue-600 hover:underline font-medium">
            support@Skolify.in
          </a>
          {' '}or contact us via WhatsApp. We will respond within 24 hours on business days.
        </p>
      </LegalSection>

      <LegalSection number="06" title="Refund Processing Timeline">
        <LegalList
          items={[
            'Approved refunds are processed within 7–10 business days',
            'Refunds are credited back to the original payment method (UPI / card / netbanking)',
            'Processing time may vary depending on your bank or payment provider',
            'You will receive an email confirmation once the refund is initiated',
          ]}
        />
      </LegalSection>

      <LegalSection number="07" title="Plan Downgrade Policy">
        <p>
          Downgrading from a higher plan to a lower plan does <strong className="text-slate-800">not</strong> result
          in a refund for the current billing period. The lower plan takes effect from the next billing cycle.
          Module access is adjusted immediately upon downgrade — modules not included in the new plan will be locked right away.
        </p>
      </LegalSection>

      <LegalSection number="08" title="Exceptional Circumstances">
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⚠️</span>
            <p className="text-sm font-bold text-blue-800">Exceptions to Standard Policy</p>
          </div>
          <p className="text-sm text-blue-900 leading-relaxed mb-3">
            In the following cases, we will issue a <strong>full refund</strong> regardless of the above policies:
          </p>
          <ul className="space-y-2">
            {[
              'Duplicate payment charged for the same period',
              'Technical error on our end preventing platform access',
              'Billing mistake or incorrect amount charged',
              'Platform-wide outage exceeding 72 hours',
            ].map(item => (
              <li key={item} className="flex items-start gap-2 text-sm text-blue-800">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-sm text-blue-900 mt-3">
            Contact support <strong>immediately</strong> if you experience any billing issues.
          </p>
        </div>
      </LegalSection>

      <LegalSection number="09" title="Contact Us">
        <p>For any refund or cancellation queries, reach out to our support team:</p>
        <LegalContact />
      </LegalSection>
    </LegalPageLayout>
  )
}