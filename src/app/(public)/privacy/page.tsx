// =============================================================
// FILE: src/app/privacy/page.tsx  (Brief)
// =============================================================

import Link from "next/link";

export default function PrivacyPage() {
    return (
        <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#0A0F1E', color: 'white', minHeight: '100vh' }}>
            <nav style={{ padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <Link href="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 700 }}>← Home</Link>
            </nav>
            <div style={{ maxWidth: 720, margin: '0 auto', padding: '60px 24px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.8 }}>
                <h1 style={{ color: 'white', fontSize: 36, fontWeight: 800, marginBottom: 32 }}>Privacy Policy</h1>
                <p><strong style={{ color: 'white' }}>Last updated:</strong> {new Date().toLocaleDateString('en-IN')}</p>
                <h2 style={{ color: 'white', marginTop: 32 }}>Data Collection</h2>
                <p>We collect school name, admin contact, student basic information (name, class, parent phone) for the purpose of school management. We do not sell your data to third parties.</p>
                <h2 style={{ color: 'white', marginTop: 32 }}>Data Storage</h2>
                <p>All data is stored securely on encrypted servers. Daily backups are maintained. Data is isolated per school (multi-tenant architecture).</p>
                <h2 style={{ color: 'white', marginTop: 32 }}>Payments</h2>
                <p>Payment processing is handled by Razorpay. We do not store card details. Razorpay is PCI DSS compliant.</p>
                <h2 style={{ color: 'white', marginTop: 32 }}>Contact</h2>
                <p>For privacy concerns: shivshakticomputeracademy25@gmail.com</p>
            </div>
        </div>
    )
}