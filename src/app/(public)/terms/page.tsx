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
    'Terms and conditions for using Skolify school management platform by Shivshakti Computer Academy.',
  alternates: { canonical: '/terms' },
}

export default function TermsPage() {
  return (
    <LegalPageLayout
      eyebrow="📄 Terms of Service"
      title="Terms & conditions for using Skolify"
      lastUpdated="January 2025"
    >
      <LegalSection number="01" title="Acceptance of Terms">
        <p>
          By registering for, accessing, or using Skolify (&quot;the Platform&quot;), you agree to be
          bound by these Terms of Service. If you do not agree with any part of these terms, do not use
          the Platform.
        </p>
        <p>
          The Platform is operated by <strong className="text-slate-800">Shivshakti Computer Academy</strong>,
          Ambikapur, Chhattisgarh, India. These terms apply to all users including school administrators,
          teachers, students, and parents.
        </p>
      </LegalSection>

      <LegalSection number="02" title="Description of Service">
        <p>
          Skolify is a cloud-based, multi-tenant School Management SaaS platform. It provides the following
          tools based on the subscribed plan:
        </p>
        <LegalList
          items={[
            'Student & staff management with profile management',
            'Attendance tracking with parent SMS notifications',
            'Online fee collection via Razorpay payment gateway',
            'Exam scheduling and result management',
            'Notice board and communication tools',
            'School website builder with multiple templates',
            '20+ additional modules based on plan tier',
          ]}
        />
      </LegalSection>

      <LegalSection number="03" title="Account Registration">
        <LegalList
          items={[
            'You must provide accurate, complete, and truthful information during registration',
            'Each school gets a unique school code — you are responsible for all activity under your account',
            'You must keep your login credentials secure and confidential',
            'We are not liable for unauthorized access resulting from compromised credentials',
            'One school per registration — multiple accounts for the same institution are not permitted',
            'You must be an authorized representative of the school to register',
          ]}
        />
      </LegalSection>

      <LegalSection number="04" title="Free Trial">
        <p>
          New registrations receive a <strong className="text-slate-800">15-day free trial</strong> with access
          to Starter-level modules only. No payment information is required during the trial.
        </p>
        <p>
          When the trial expires, all features are blocked. Your data remains intact. You can activate
          a paid plan at any time to resume access from where you left off.
        </p>
      </LegalSection>

      <LegalSection number="05" title="Subscription & Payments">
        <LegalList
          items={[
            'Paid plans are billed monthly or yearly via Razorpay',
            'All prices are listed in INR (₹) inclusive of applicable taxes',
            'Prices may change with prior notice of at least 30 days',
            'You can upgrade your plan at any time — effective immediately',
            'Upon plan expiry or cancellation, features are immediately blocked',
            'Data is retained for 90 days after expiry — you can reactivate anytime',
            'GST and other applicable Indian taxes will be charged as per law',
          ]}
        />
      </LegalSection>

      <LegalSection number="06" title="Acceptable Use Policy">
        <p>You agree to use Skolify only for lawful school management purposes. You must NOT:</p>
        <LegalList
          items={[
            'Use the platform for any unlawful or unauthorized purpose',
            'Attempt to access, view, or modify another school\'s data',
            'Reverse engineer, decompile, or scrape any part of the platform',
            'Upload malicious content, viruses, or harmful scripts',
            'Share admin credentials with unauthorized persons outside your school',
            'Use automated bots or scripts to interact with the platform',
            'Misrepresent your identity or school information',
            'Use the platform to send spam or unsolicited communications',
          ]}
        />
        <p>
          Violation of this policy may result in immediate account suspension without refund.
        </p>
      </LegalSection>

      <LegalSection number="07" title="Data Ownership">
        <p>
          You retain full ownership of all data you enter into Skolify — including student records,
          fee data, attendance, and exam data. We do not claim ownership of your data.
        </p>
        <p>
          We act as a <strong className="text-slate-800">data processor</strong> on your behalf. You can
          request data export in PDF or Excel format, or request complete data deletion at any time by
          contacting support.
        </p>
      </LegalSection>

      <LegalSection number="08" title="Service Availability">
        <p>
          We strive for high uptime but do not guarantee 100% availability. The following may cause
          temporary downtime:
        </p>
        <LegalList
          items={[
            'Scheduled maintenance (announced in advance when possible)',
            'Emergency security patches',
            'Third-party service disruptions (MongoDB Atlas, Vercel, etc.)',
            'Force majeure events beyond our control',
          ]}
        />
        <p>
          We will notify users of planned maintenance via in-app notices and email when possible.
        </p>
      </LegalSection>

      <LegalSection number="09" title="Intellectual Property">
        <p>
          Skolify, its design, code, features, and brand identity are the intellectual property of
          Shivshakti Computer Academy. You may not copy, reproduce, or distribute any part of the
          platform without explicit written permission.
        </p>
        <p>
          Your school&apos;s name, logo (if uploaded), and data remain your property. We do not use your
          school&apos;s information for marketing without your explicit consent.
        </p>
      </LegalSection>

      <LegalSection number="10" title="Limitation of Liability">
        <p>
          To the maximum extent permitted by applicable Indian law, Shivshakti Computer Academy shall
          not be liable for any:
        </p>
        <LegalList
          items={[
            'Indirect, incidental, or consequential damages',
            'Loss of data due to user error or third-party service failures',
            'Losses arising from unauthorized access to your account',
            'Service interruptions or temporary unavailability',
          ]}
        />
        <p>
          Our total liability shall not exceed the amount you paid for the platform in the preceding
          3 months.
        </p>
      </LegalSection>

      <LegalSection number="11" title="Termination">
        <p>
          <strong className="text-slate-800">By You:</strong> You may terminate your account at any time
          by contacting support or cancelling your subscription. Your data will be retained for 90 days
          after termination.
        </p>
        <p>
          <strong className="text-slate-800">By Us:</strong> We may suspend or terminate your account
          without notice if you violate these terms, engage in fraudulent activity, or abuse the platform.
          In such cases, no refund will be issued.
        </p>
      </LegalSection>

      <LegalSection number="12" title="Governing Law & Disputes">
        <p>
          These Terms of Service are governed by the laws of India. Any disputes arising from the use
          of Skolify shall be subject to the exclusive jurisdiction of courts in{' '}
          <strong className="text-slate-800">Ambikapur, Chhattisgarh, India</strong>.
        </p>
        <p>
          We encourage resolving any issues through our support channels before pursuing legal action.
          Most concerns can be addressed quickly through direct communication.
        </p>
      </LegalSection>

      <LegalSection number="13" title="Changes to Terms">
        <p>
          We reserve the right to update these Terms of Service at any time. Changes will be posted on
          this page with an updated date. For significant changes, we will notify users via email or
          in-app notification at least 7 days in advance.
        </p>
        <p>
          Continued use of the platform after changes become effective constitutes your acceptance of
          the new terms.
        </p>
      </LegalSection>

      <LegalSection number="14" title="Contact Us">
        <p>
          For any questions about these Terms of Service, please contact us:
        </p>
        <LegalContact />
      </LegalSection>
    </LegalPageLayout>
  )
}