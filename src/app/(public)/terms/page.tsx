// =============================================================
// FILE: src/app/terms/page.tsx
// =============================================================

import Link from "next/link";

 
export default function TermsPage() {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#0A0F1E', color: 'white', minHeight: '100vh' }}>
      <nav style={{ padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <Link href="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 700 }}>← Home</Link>
      </nav>
      <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
        <h1 style={{ color: 'white', fontSize: 36, fontWeight: 800, marginBottom: 32 }}>Terms of Service</h1>
        <p><strong style={{ color: 'white' }}>Last updated:</strong> {new Date().toLocaleDateString('en-IN')}</p>
        <h2 style={{ color: 'white', marginTop: 32 }}>Service</h2>
        <p>Shivshakti School Suite provides school management software as a service. Service is provided as-is with 99.9% uptime SLA.</p>
        <h2 style={{ color: 'white', marginTop: 32 }}>Payment</h2>
        <p>Subscriptions are billed monthly or yearly. All prices include 18% GST. Refunds are not available for used periods. Pro-rata credit applies for mid-period upgrades.</p>
        <h2 style={{ color: 'white', marginTop: 32 }}>Data Ownership</h2>
        <p>You own your school's data. We process it to provide the service. You can export your data at any time. On cancellation, data is retained for 30 days then deleted.</p>
        <h2 style={{ color: 'white', marginTop: 32 }}>Cancellation</h2>
        <p>You can cancel anytime. Service continues till end of paid period. No cancellation fee.</p>
        <h2 style={{ color: 'white', marginTop: 32 }}>Contact</h2>
        <p>shivshakticomputeracademy25@gmail.com · +91 74770 36832</p>
      </div>
    </div>
  )
}