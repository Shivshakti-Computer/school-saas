// FILE: src/app/(public)/terms/page.tsx

import {
  LegalPageLayout,
  LegalSection,
  LegalList,
  LegalContact,
} from '@/components/marketing/LegalPageLayout'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Terms of Service — Usage Rules & Guidelines',
  description:
    'Terms and conditions for using VidyaFlow school management platform by Shivshakti Computer Academy.',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <LegalPageLayout
      eyebrow="✦ Terms of Service"
      title="Terms & conditions for using VidyaFlow"
      lastUpdated="January 2025"
    >
      <LegalSection number="01" title="Acceptance of Terms">
        <p>
          By registering for, accessing, or using VidyaFlow (&quot;the Platform&quot;), you agree to be
          bound by these Terms of Service. If you do not agree, do not use the Platform. The Platform is
          operated by Shivshakti Computer Academy, Ambikapur, Chhattisgarh, India.
        </p>
      </LegalSection>

      <LegalSection number="02" title="Description of Service">
        <p>
          VidyaFlow is a cloud-based, multi-tenant school management platform (SaaS). It provides tools
          for student management, attendance, fee collection, exam results, notices, website builder,
          and other modules based on the subscribed plan.
        </p>
      </LegalSection>

      <LegalSection number="03" title="Account Registration">
        <LegalList
          items={[
            'You must provide accurate and complete information during registration.',
            'Each school gets a unique school code. You are responsible for all activity under your account.',
            'You must keep your login credentials secure. We are not liable for unauthorized access due to compromised credentials.',
            'One school per registration. Do not create multiple accounts for the same institution.',
          ]}
        />
      </LegalSection>

      <LegalSection number="04" title="Free Trial">
        <p>
          New registrations receive a limited free trial with access to Starter-level modules only. When the
          trial expires, all features are blocked until a paid plan is activated. No payment information is
          required during trial.
        </p>
      </LegalSection>

      <LegalSection number="05" title="Subscription & Payments">
        <LegalList
          items={[
            'Paid plans are billed monthly or yearly via Razorpay.',
            'Prices are listed in INR (₹) and may change with prior notice.',
            'You can upgrade your plan at any time from the admin panel.',
            'Upon plan expiry or cancellation, features are immediately blocked. Data is retained for 90 days.',
            'GST / taxes may apply as per Indian law when applicable.',
          ]}
        />
      </LegalSection>

      <LegalSection number="06" title="Acceptable Use">
        <p>You agree not to:</p>
        <LegalList
          items={[
            'Use the platform for any unlawful purpose',
            'Attempt to access other schools\' data',
            'Reverse engineer, decompile, or scrape the platform',
            'Upload malicious content, viruses, or harmful scripts',
            'Share your admin credentials with unauthorized persons',
          ]}
        />
      </LegalSection>

      <LegalSection number="07" title="Data Ownership">
        <p>
          You own all data you enter into the platform (student records, fee data, etc.). We do not claim
          ownership of your data. We act as a data processor on your behalf. You may request data export
          or deletion at any time.
        </p>
      </LegalSection>

      <LegalSection number="08" title="Service Availability">
        <p>
          We strive for high uptime but do not guarantee 100% availability. Scheduled maintenance, updates,
          and unforeseen issues may cause temporary downtime. We will notify users of planned maintenance
          when possible.
        </p>
      </LegalSection>

      <LegalSection number="09" title="Limitation of Liability">
        <p>
          To the maximum extent permitted by law, Shivshakti Computer Academy shall not be liable for any
          indirect, incidental, or consequential damages arising from the use of the platform. Our total
          liability shall not exceed the amount you paid for the platform in the preceding 12 months.
        </p>
      </LegalSection>

      <LegalSection number="10" title="Termination">
        <p>
          We may suspend or terminate your account if you violate these terms. You may terminate your
          account at any time by contacting support. Upon termination, your data will be retained for 90
          days, after which it may be permanently deleted.
        </p>
      </LegalSection>

      <LegalSection number="11" title="Governing Law">
        <p>
          These terms are governed by the laws of India. Any disputes shall be subject to the exclusive
          jurisdiction of courts in Ambikapur, Chhattisgarh.
        </p>
      </LegalSection>

      <LegalSection number="12" title="Contact">
        <LegalContact />
      </LegalSection>
    </LegalPageLayout>
  )
}