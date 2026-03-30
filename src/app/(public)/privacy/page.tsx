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
    'Privacy Policy for Skolify by Shivshakti Computer Academy — how we collect, use, store, and protect your school data.',
  alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
  return (
    <LegalPageLayout
      eyebrow="🔒 Privacy Policy"
      title="How we collect, use & protect your data"
      lastUpdated="January 2025"
    >
      <LegalSection number="01" title="Introduction">
        <p>
          Skolify (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;) is a product of Shivshakti Computer Academy,
          Ambikapur, Chhattisgarh, India. This Privacy Policy explains how we collect, use, store, and
          protect information when you use our school management platform.
        </p>
        <p>
          By using Skolify, you agree to the collection and use of information in accordance with this policy.
          We are committed to protecting your school&apos;s data with the highest standards.
        </p>
      </LegalSection>

      <LegalSection number="02" title="Information We Collect">
        <p>We collect the following types of information:</p>
        <LegalList
          items={[
            <span key="a"><strong className="text-slate-800">School Registration Data:</strong> School name, address, phone, email, subdomain</span>,
            <span key="b"><strong className="text-slate-800">User Data:</strong> Name, phone, email, role, login timestamps</span>,
            <span key="c"><strong className="text-slate-800">Student Data:</strong> Name, admission number, class, section, parent details, address</span>,
            <span key="d"><strong className="text-slate-800">Operational Data:</strong> Attendance records, fee transactions, exam marks, notices</span>,
            <span key="e"><strong className="text-slate-800">Payment Data:</strong> Transaction IDs, subscription details (card/UPI details are handled by Razorpay — not stored by us)</span>,
          ]}
        />
      </LegalSection>

      <LegalSection number="03" title="How We Use Your Information">
        <LegalList
          items={[
            'To provide and maintain the school management platform',
            'To authenticate users and enforce role-based access control',
            'To process subscription payments via Razorpay',
            'To send important notifications about your account or subscription',
            'To improve our platform based on usage patterns (anonymized data only)',
            'To provide customer support and onboarding assistance',
          ]}
        />
      </LegalSection>

      <LegalSection number="04" title="Data Sharing">
        <p>
          We do <strong className="text-slate-800">not</strong> sell, rent, or share your school data with any
          third party for commercial purposes. Data is shared only in these specific cases:
        </p>
        <LegalList
          items={[
            <span key="a"><strong className="text-slate-800">Payment Processing:</strong> Razorpay processes payments on our behalf — they maintain their own privacy policy</span>,
            <span key="b"><strong className="text-slate-800">Legal Requirements:</strong> If required by Indian law or a valid court order</span>,
            <span key="c"><strong className="text-slate-800">Cloud Infrastructure:</strong> Data is stored on MongoDB Atlas cloud servers with encryption at rest</span>,
          ]}
        />
      </LegalSection>

      <LegalSection number="05" title="Data Security">
        <p>
          We implement industry-standard security measures to protect your data:
        </p>
        <LegalList
          items={[
            'HTTPS/TLS encryption for all data in transit',
            'bcrypt password hashing — plain-text passwords never stored',
            'JWT-based session management with automatic refresh',
            'Role-based access control (Admin, Teacher, Student, Parent)',
            'Multi-tenant data isolation — each school\'s data is completely separate',
            'Plan-based module locking enforced at middleware level',
          ]}
        />
        <p>
          See our{' '}
          <a href="/security" className="text-blue-600 hover:underline font-medium">
            Security page
          </a>{' '}
          for detailed technical information.
        </p>
      </LegalSection>

      <LegalSection number="06" title="Data Retention">
        <p>
          Your data is retained for the duration of your active subscription. After subscription
          cancellation or expiry, we retain your data for <strong className="text-slate-800">90 days</strong> as
          a grace period — so you can reactivate anytime. After that, data may be permanently deleted.
          You can request early deletion by contacting support.
        </p>
      </LegalSection>

      <LegalSection number="07" title="Cookies">
        <p>
          We use <strong className="text-slate-800">essential cookies only</strong> — for authentication
          (session tokens) and basic platform functionality. We do not use advertising cookies, analytics
          trackers, or third-party tracking cookies of any kind.
        </p>
      </LegalSection>

      <LegalSection number="08" title="Your Rights">
        <p>As a user of Skolify, you have the following rights regarding your data:</p>
        <LegalList
          items={[
            'Request access to all data we hold about you',
            'Request correction of any inaccurate or outdated data',
            'Request deletion of your data at any time',
            'Export your data in a standard format (PDF / Excel)',
            'Opt out of any non-essential communications',
          ]}
        />
        <p>
          To exercise any of these rights, contact us at{' '}
          <a href="mailto:support@Skolify.in" className="text-blue-600 hover:underline font-medium">
            support@Skolify.in
          </a>
          . We will respond within 72 hours.
        </p>
      </LegalSection>

      <LegalSection number="09" title="Children's Data">
        <p>
          Skolify is designed for schools and handles student data including minors. Student data is
          entered by school administrators and is governed by the school&apos;s own data policies. We do not
          directly collect data from children. Schools are responsible for obtaining necessary parental
          consents as per applicable law.
        </p>
      </LegalSection>

      <LegalSection number="10" title="Changes to This Policy">
        <p>
          We may update this Privacy Policy from time to time. Any changes will be posted on this page
          with an updated &quot;Last updated&quot; date. Continued use of the platform after changes
          constitutes acceptance of the new policy. We recommend reviewing this page periodically.
        </p>
      </LegalSection>

      <LegalSection number="11" title="Contact Us">
        <p>
          If you have any questions about this Privacy Policy or how we handle your data, please reach out:
        </p>
        <LegalContact />
      </LegalSection>
    </LegalPageLayout>
  )
}