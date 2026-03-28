// FILE: src/app/(public)/privacy/page.tsx

import {
  LegalPageLayout,
  LegalSection,
  LegalList,
  LegalContact,
} from '@/components/marketing/LegalPageLayout'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — How We Protect Your Data',
  description:
    'Privacy Policy for VidyaFlow by Shivshakti Computer Academy — how we collect, use, store, and protect your school data.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      eyebrow="✦ Privacy Policy"
      title="How we collect, use & protect your data"
      lastUpdated="January 2025"
    >
      <LegalSection number="01" title="Introduction">
        <p>
          VidyaFlow (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is a product of Shivshakti Computer Academy,
          Ambikapur, Chhattisgarh, India. This Privacy Policy explains how we collect, use, store, and
          protect information when you use our school management platform.
        </p>
      </LegalSection>

      <LegalSection number="02" title="Information We Collect">
        <p>We collect the following types of information:</p>
        <LegalList
          items={[
            <span><strong className="text-slate-300">School Registration Data:</strong> School name, address, phone, email, subdomain</span>,
            <span><strong className="text-slate-300">User Data:</strong> Name, phone, email, role, login timestamps</span>,
            <span><strong className="text-slate-300">Student Data:</strong> Name, admission number, class, section, parent details, address</span>,
            <span><strong className="text-slate-300">Operational Data:</strong> Attendance records, fee transactions, exam marks, notices</span>,
            <span><strong className="text-slate-300">Payment Data:</strong> Transaction IDs, subscription details (card/UPI details are handled by Razorpay, not stored by us)</span>,
          ]}
        />
      </LegalSection>

      <LegalSection number="03" title="How We Use Your Information">
        <LegalList
          items={[
            'To provide and maintain the school management platform',
            'To authenticate users and enforce role-based access',
            'To process subscription payments via Razorpay',
            'To send important notifications about your account or subscription',
            'To improve our platform based on usage patterns (anonymized)',
          ]}
        />
      </LegalSection>

      <LegalSection number="04" title="Data Sharing">
        <p>
          We do <strong className="text-slate-300">not</strong> sell, rent, or share your school data with any
          third party. Data is shared only in these cases:
        </p>
        <LegalList
          items={[
            <span><strong className="text-slate-300">Payment Processing:</strong> Razorpay processes payments — they have their own privacy policy</span>,
            <span><strong className="text-slate-300">Legal Requirements:</strong> If required by Indian law or court order</span>,
            <span><strong className="text-slate-300">Cloud Infrastructure:</strong> Data is stored on MongoDB Atlas and hosted on cloud servers (encrypted at rest)</span>,
          ]}
        />
      </LegalSection>

      <LegalSection number="05" title="Data Security">
        <p>
          We implement industry-standard security measures including HTTPS encryption, bcrypt password
          hashing, JWT-based sessions, role-based access control, and multi-tenant data isolation.
          See our{' '}
          <a href="/security" className="text-brand-400 hover:underline">
            Security page
          </a>{' '}
          for detailed information.
        </p>
      </LegalSection>

      <LegalSection number="06" title="Data Retention">
        <p>
          Your data is retained for the duration of your active subscription. After subscription cancellation
          or expiry, we retain data for 90 days as a grace period. After that, data may be permanently
          deleted. You can request early deletion by contacting support.
        </p>
      </LegalSection>

      <LegalSection number="07" title="Cookies">
        <p>
          We use essential cookies only — for authentication (session tokens) and basic platform
          functionality. We do not use advertising cookies or third-party tracking cookies.
        </p>
      </LegalSection>

      <LegalSection number="08" title="Your Rights">
        <LegalList
          items={[
            'Request access to your data',
            'Request correction of inaccurate data',
            'Request deletion of your data',
            'Export your data in a standard format (PDF / Excel)',
          ]}
        />
        <p>
          To exercise these rights, contact us at{' '}
          <a href="mailto:support@vidyaflow.in" className="text-brand-400 hover:underline">
            support@vidyaflow.in
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection number="09" title="Changes to This Policy">
        <p>
          We may update this policy from time to time. Changes will be posted on this page with an updated
          date. Continued use of the platform after changes constitutes acceptance of the new policy.
        </p>
      </LegalSection>

      <LegalSection number="10" title="Contact">
        <LegalContact />
      </LegalSection>
    </LegalPageLayout>
  )
}