// =============================================================
// FILE: src/app/about/page.tsx
// =============================================================
"use client"
 
import Link from 'next/link'
 
export default function AboutPage() {
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#0A0F1E', color: 'white', minHeight: '100vh' }}>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800&family=DM+Sans:wght@300;400;500&display=swap'); .jakarta{font-family:'Plus Jakarta Sans',sans-serif}`}</style>
 
      {/* Simple nav */}
      <nav style={{ padding: '20px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Link href="/" style={{ color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: 16 }} className="jakarta">← Shivshakti School Suite</Link>
        <Link href="/register" style={{ background: '#4F46E5', color: 'white', padding: '8px 20px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>Free Trial</Link>
      </nav>
 
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '80px 24px' }}>
        <p style={{ fontSize: 12, color: '#818CF8', letterSpacing: '0.1em', marginBottom: 12, fontWeight: 600 }}>ABOUT US</p>
        <h1 className="jakarta" style={{ fontSize: 48, fontWeight: 800, margin: '0 0 24px', lineHeight: 1.1 }}>
          Shivshakti Computer Academy
        </h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.6)', lineHeight: 1.8, marginBottom: 40 }}>
          Ambikapur, Chhattisgarh mein hum 10+ saalon se computer education de rahe hain.
          Hamare saath 1000+ students ne digital skills seekhi hain.
        </p>
 
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 48 }}>
          {[
            { val: '10+', label: 'Years of Experience' },
            { val: '1000+', label: 'Students Trained' },
            { val: 'MSME', label: 'Government Registered' },
            { val: 'ISO 9001', label: 'Quality Certified' },
          ].map(s => (
            <div key={s.label} style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '20px 24px' }}>
              <p className="jakarta" style={{ fontSize: 28, fontWeight: 800, color: '#818CF8', margin: 0 }}>{s.val}</p>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', margin: '4px 0 0' }}>{s.label}</p>
            </div>
          ))}
        </div>
 
        <div style={{ borderLeft: '3px solid #4F46E5', paddingLeft: 20, marginBottom: 40 }}>
          <p className="jakarta" style={{ fontSize: 20, fontWeight: 700, marginBottom: 12 }}>Our Mission</p>
          <p style={{ color: 'rgba(255,255,255,0.6)', lineHeight: 1.8 }}>
            Chhattisgarh ke schools ko affordable, Hindi-first technology dena.
            Digital divide khatam karna. Har school ke paas professional digital infrastructure hona chahiye —
            chahe woh chhota ho ya bada.
          </p>
        </div>
 
        <div style={{ background: 'rgba(79,70,229,0.1)', border: '1px solid rgba(79,70,229,0.2)', borderRadius: 12, padding: 24 }}>
          <p className="jakarta" style={{ fontWeight: 700, marginBottom: 8 }}>Contact Us</p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', margin: 0 }}>
            📍 Ambikapur, Surguja, Chhattisgarh<br />
            📞 +91 74770 36832<br />
            ✉️ shivshakticomputeracademy25@gmail.com
          </p>
        </div>
      </div>
    </div>
  )
}