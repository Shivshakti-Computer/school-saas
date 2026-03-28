import { Container } from '@/components/marketing/Container'
import { SectionTitle } from '@/components/marketing/MiniUI'

export const metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for VidyaFlow — how we collect, use, and protect your data.',
}

export default function PrivacyPage() {
  return (
    <div className="py-12">
      <Container>
        <SectionTitle
          eyebrow="Legal"
          title="Privacy Policy"
          subtitle="Last updated: January 2025"
        />

        <div className="mt-8 max-w-3xl prose prose-sm prose-slate">
          <div className="space-y-8">

            <section>
              <h3 className="text-base font-extrabold text-slate-900">1. Introduction</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Shivshakti School Suite ("we", "our", "us") is a product of Shivshakti Computer Academy, 
                Ambikapur, Chhattisgarh, India. This Privacy Policy explains how we collect, use, store, and 
                protect information when you use our school management platform.
              </p>
            </section>

            <section>
              <h3 className="text-base font-extrabold text-slate-900">2. Information We Collect</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">We collect the following types of information:</p>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> <strong>School Registration Data:</strong> School name, address, phone, email, subdomain</li>
                <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> <strong>User Data:</strong> Name, phone, email, role, login timestamps</li>
                <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> <strong>Student Data:</strong> Name, admission number, class, section, parent details, address</li>
                <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> <strong>Operational Data:</strong> Attendance records, fee transactions, exam marks, notices</li>
                <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> <strong>Payment Data:</strong> Transaction IDs, subscription details (card/UPI details are handled by Razorpay, not stored by us)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-base font-extrabold text-slate-900">3. How We Use Your Information</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> To provide and maintain the school management platform</li>
                <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> To authenticate users and enforce role-based access</li>
                <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> To process subscription payments</li>
                <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> To send important notifications about your account or subscription</li>
                <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> To improve our platform based on usage patterns (anonymized)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-base font-extrabold text-slate-900">4. Data Sharing</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                We do <strong>not</strong> sell, rent, or share your school data with any third party. Data is shared only in these cases:
              </p>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> <strong>Payment Processing:</strong> Razorpay processes payments — they have their own privacy policy</li>
                <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> <strong>Legal Requirements:</strong> If required by Indian law or court order</li>
                <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> <strong>Cloud Infrastructure:</strong> Data is stored on MongoDB Atlas and hosted on cloud servers (encrypted)</li>
              </ul>
            </section>

            <section>
              <h3 className="text-base font-extrabold text-slate-900">5. Data Security</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                We implement industry-standard security measures including HTTPS encryption, bcrypt password 
                hashing, JWT-based sessions, role-based access control, and multi-tenant data isolation. 
                See our <a href="/security" className="text-indigo-600 hover:underline">Security page</a> for details.
              </p>
            </section>

            <section>
              <h3 className="text-base font-extrabold text-slate-900">6. Data Retention</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Your data is retained for the duration of your active subscription. After subscription cancellation 
                or expiry, we retain data for 90 days as a grace period. After that, data may be permanently 
                deleted. You can request early deletion by contacting support.
              </p>
            </section>

            <section>
              <h3 className="text-base font-extrabold text-slate-900">7. Cookies</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                We use essential cookies only — for authentication (session tokens) and basic platform 
                functionality. We do not use advertising cookies or third-party tracking cookies.
              </p>
            </section>

            <section>
              <h3 className="text-base font-extrabold text-slate-900">8. Your Rights</h3>
              <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
                <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> Request access to your data</li>
                <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> Request correction of inaccurate data</li>
                <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> Request deletion of your data</li>
                <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> Export your data in a standard format</li>
              </ul>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                To exercise these rights, contact us at <strong>support@yourdomain.com</strong>.
              </p>
            </section>

            <section>
              <h3 className="text-base font-extrabold text-slate-900">9. Changes to This Policy</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                We may update this policy from time to time. Changes will be posted on this page with an updated 
                date. Continued use of the platform after changes constitutes acceptance of the new policy.
              </p>
            </section>

            <section>
              <h3 className="text-base font-extrabold text-slate-900">10. Contact</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                For any privacy-related questions:<br />
                <strong>Shivshakti Computer Academy</strong><br />
                Ambikapur, Chhattisgarh, India<br />
                Email: support@yourdomain.com<br />
                Phone: +91-XXXXXXXXXX
              </p>
            </section>

          </div>
        </div>
      </Container>
    </div>
  )
}