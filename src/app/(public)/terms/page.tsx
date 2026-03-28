import { Container } from '@/components/marketing/Container'
import { SectionTitle } from '@/components/marketing/MiniUI'

export const metadata = {
  title: 'Terms of Service',
  description: 'Terms and conditions for using VidyaFlow platform.',
}

export default function TermsPage() {
  return (
    <div className="py-12">
      <Container>
        <SectionTitle
          eyebrow="Legal"
          title="Terms of Service"
          subtitle="Last updated: January 2025"
        />

        <div className="mt-8 max-w-3xl space-y-8">

          <section>
            <h3 className="text-base font-extrabold text-slate-900">1. Acceptance of Terms</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              By registering for, accessing, or using Shivshakti School Suite ("the Platform"), you agree to be 
              bound by these Terms of Service. If you do not agree, do not use the Platform. The Platform is 
              operated by Shivshakti Computer Academy, Ambikapur, Chhattisgarh, India.
            </p>
          </section>

          <section>
            <h3 className="text-base font-extrabold text-slate-900">2. Description of Service</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              Shivshakti School Suite is a cloud-based, multi-tenant school management platform (SaaS). It 
              provides tools for student management, attendance, fee collection, exam results, notices, website 
              builder, and other modules based on the subscribed plan.
            </p>
          </section>

          <section>
            <h3 className="text-base font-extrabold text-slate-900">3. Account Registration</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
              <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> You must provide accurate and complete information during registration.</li>
              <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> Each school gets a unique subdomain (school code). You are responsible for all activity under your account.</li>
              <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> You must keep your login credentials secure. We are not liable for unauthorized access due to compromised credentials.</li>
              <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> One school per registration. Do not create multiple accounts for the same institution.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-extrabold text-slate-900">4. Free Trial</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              New registrations receive a limited free trial with access to Starter-level modules only. When the 
              trial expires, all features are blocked until a paid plan is activated. No payment information is 
              required during trial.
            </p>
          </section>

          <section>
            <h3 className="text-base font-extrabold text-slate-900">5. Subscription & Payments</h3>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
              <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> Paid plans are billed monthly or yearly via Razorpay.</li>
              <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> Prices are listed in INR (₹) and may change with prior notice.</li>
              <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> You can upgrade, downgrade, or cancel your plan at any time from the admin panel.</li>
              <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> Upon plan expiry or cancellation, features are immediately blocked. Data is retained for 90 days.</li>
              <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> GST / taxes may apply as per Indian law.</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-extrabold text-slate-900">6. Acceptable Use</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">You agree not to:</p>
            <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
              <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> Use the platform for any unlawful purpose</li>
              <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> Attempt to access other schools' data</li>
              <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> Reverse engineer, decompile, or scrape the platform</li>
              <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> Upload malicious content, viruses, or harmful scripts</li>
              <li className="flex items-start gap-2"><span className="text-indigo-600 font-bold">•</span> Share your admin credentials with unauthorized persons</li>
            </ul>
          </section>

          <section>
            <h3 className="text-base font-extrabold text-slate-900">7. Data Ownership</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              You own all data you enter into the platform (student records, fee data, etc.). We do not claim 
              ownership of your data. We act as a data processor on your behalf. You may request data export 
              or deletion at any time.
            </p>
          </section>

          <section>
            <h3 className="text-base font-extrabold text-slate-900">8. Service Availability</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              We strive for high uptime but do not guarantee 100% availability. Scheduled maintenance, updates, 
              and unforeseen issues may cause temporary downtime. We will notify users of planned maintenance 
              when possible.
            </p>
          </section>

          <section>
            <h3 className="text-base font-extrabold text-slate-900">9. Limitation of Liability</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              To the maximum extent permitted by law, Shivshakti Computer Academy shall not be liable for any 
              indirect, incidental, or consequential damages arising from the use of the platform. Our total 
              liability shall not exceed the amount you paid for the platform in the preceding 12 months.
            </p>
          </section>

          <section>
            <h3 className="text-base font-extrabold text-slate-900">10. Termination</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              We may suspend or terminate your account if you violate these terms. You may terminate your 
              account at any time by contacting support. Upon termination, your data will be retained for 90 
              days, after which it may be permanently deleted.
            </p>
          </section>

          <section>
            <h3 className="text-base font-extrabold text-slate-900">11. Governing Law</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              These terms are governed by the laws of India. Any disputes shall be subject to the exclusive 
              jurisdiction of courts in Ambikapur, Chhattisgarh.
            </p>
          </section>

          <section>
            <h3 className="text-base font-extrabold text-slate-900">12. Contact</h3>
            <p className="mt-2 text-sm text-slate-600 leading-relaxed">
              For questions about these terms:<br />
              <strong>Shivshakti Computer Academy</strong><br />
              Ambikapur, Chhattisgarh, India<br />
              Email: support@yourdomain.com
            </p>
          </section>

        </div>
      </Container>
    </div>
  )
}