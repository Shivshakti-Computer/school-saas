// FILE: src/app/page.tsx — LANDING PAGE (Professional English)
"use client"


import Link from 'next/link'
import { PLANS, getSavings } from '@/lib/plans'
import type { PlanId } from '@/lib/plans'

export default function LandingPage() {
  const plans = Object.values(PLANS)
  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: '#0A0F1E', color: 'white', minHeight: '100vh' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&family=DM+Sans:ital,wght@0,300;0,400;0,500;1,400&display=swap');
        .j { font-family: 'Plus Jakarta Sans', sans-serif; }
        .grad { background: linear-gradient(135deg,#818CF8 0%,#38BDF8 50%,#34D399 100%); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
        a { text-decoration: none; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        details summary::-webkit-details-marker { display: none; }
        details summary { list-style: none; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:none} }
        .fade { animation: fadeUp 0.6s ease both; }
        @keyframes pulse2 { 0%,100%{opacity:1} 50%{opacity:0.35} }
        .live-dot { animation: pulse2 2s ease infinite; }
      `}</style>

      {/* ── NAV ── */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(10,15,30,0.9)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
        <nav style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 800 }} className="j">S</div>
            <span className="j" style={{ fontWeight: 700, fontSize: 15, color: 'white' }}>Shivshakti <span style={{ color: '#818CF8' }}>School Suite</span></span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {[['Features', '#features'], ['Pricing', '#pricing'], ['About', '/about'], ['Contact', '/contact']].map(([l, h]) => (
              <a key={l} href={h} style={{ padding: '8px 14px', fontSize: 14, color: 'rgba(255,255,255,0.6)', borderRadius: 8, transition: 'color 0.15s' }}
                onMouseOver={e => (e.currentTarget.style.color = 'white')} onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.6)')}>{l}</a>
            ))}
            <a href="/login" style={{ padding: '8px 14px', fontSize: 14, color: 'rgba(255,255,255,0.7)', marginLeft: 4 }}>Sign In</a>
            <Link href="/register" style={{ marginLeft: 4, background: 'linear-gradient(135deg,#4F46E5,#6D28D9)', color: 'white', fontSize: 14, fontWeight: 600, padding: '9px 20px', borderRadius: 9, boxShadow: '0 4px 14px rgba(79,70,229,0.4)' }}>Start Free Trial</Link>
          </div>
        </nav>
      </header>

      {/* ── HERO ── */}
      <section style={{ maxWidth: 940, margin: '0 auto', padding: '110px 24px 80px', textAlign: 'center' }}>
        <div className="fade" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 99, padding: '6px 16px', marginBottom: 28 }}>
          <span className="live-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#34D399', display: 'inline-block', flexShrink: 0 }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: '#A5B4FC', letterSpacing: '0.06em' }}>TRUSTED BY 50+ SCHOOLS ACROSS CHHATTISGARH</span>
        </div>
        <h1 className="j fade" style={{ fontSize: 'clamp(38px,6vw,68px)', fontWeight: 800, lineHeight: 1.07, letterSpacing: '-0.025em', marginBottom: 22, animationDelay: '0.1s' }}>
          The Complete School<br /><span className="grad">Management Platform</span>
        </h1>
        <p className="fade" style={{ fontSize: 'clamp(16px,2vw,20px)', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, maxWidth: 620, margin: '0 auto 38px', fontWeight: 300, animationDelay: '0.2s' }}>
          Students, fees, attendance, results, and notices — managed from one platform.
          Give parents a mobile app. Launch your school website in minutes.
        </p>
        <div className="fade" style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48, animationDelay: '0.3s' }}>
          <Link href="/register" style={{ background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', color: 'white', fontWeight: 700, fontSize: 16, padding: '14px 32px', borderRadius: 12, boxShadow: '0 8px 28px rgba(79,70,229,0.45)', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            Start Free 15-Day Trial <span style={{ fontSize: 18 }}>→</span>
          </Link>
          <a href="#features" style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', fontWeight: 600, fontSize: 15, padding: '14px 28px', borderRadius: 12 }}>See Features</a>
        </div>
        <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
          {['No credit card required', 'Setup in 5 minutes', 'Cancel anytime', 'Hindi & English support'].map(t => (
            <span key={t}>✓ {t}</span>
          ))}
        </div>
      </section>

      {/* ── DASHBOARD PREVIEW ── */}
      <section style={{ maxWidth: 1000, margin: '0 auto', padding: '0 24px 80px' }}>
        <div style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(124,58,237,0.08))', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 20, padding: 2, overflow: 'hidden' }}>
          <div style={{ background: 'rgba(255,255,255,0.04)', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', gap: 6 }}>
              {['#FF5F57', '#FFBD2E', '#28C840'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />)}
            </div>
            <div style={{ flex: 1, height: 26, maxWidth: 280, margin: '0 auto', background: 'rgba(255,255,255,0.05)', borderRadius: 6, display: 'flex', alignItems: 'center', paddingLeft: 10, fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
              demo.shivshakticloud.in/admin
            </div>
          </div>
          <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '180px 1fr', gap: 14 }}>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: 12, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <div style={{ height: 30, background: 'rgba(99,102,241,0.2)', borderRadius: 7, marginBottom: 8, display: 'flex', alignItems: 'center', paddingLeft: 10, fontSize: 11, color: '#818CF8', fontWeight: 600 }} className="j">Demo Public School</div>
              {['Dashboard', 'Students', 'Attendance', 'Fees', 'Results', 'Notices'].map((m, i) => (
                <div key={m} style={{ height: 28, background: i === 0 ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.03)', borderRadius: 6, display: 'flex', alignItems: 'center', paddingLeft: 10, fontSize: 11, color: i === 0 ? '#A5B4FC' : 'rgba(255,255,255,0.35)' }}>{m}</div>
              ))}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
                {[{ l: 'Total Students', v: '347', c: '#818CF8' }, { l: 'Present Today', v: '329', c: '#34D399' }, { l: 'Fee Due', v: '₹18,500', c: '#F59E0B' }, { l: 'Active Notices', v: '4', c: '#38BDF8' }].map(s => (
                  <div key={s.l} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 9, padding: '10px 12px' }}>
                    <p style={{ fontSize: 18, fontWeight: 700, color: s.c }}>{s.v}</p>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 2 }}>{s.l}</p>
                  </div>
                ))}
              </div>
              <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 9, padding: 12 }}>
                <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>Recent Activity</p>
                {['Attendance marked — Class 10A (47 students)', 'Fee collected — Rahul Kumar ₹3,500', 'Result published — Half Yearly Exam 2025'].map(a => (
                  <div key={a} style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>{a}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── METRICS ── */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)', padding: '36px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', gap: 48, justifyContent: 'center', flexWrap: 'wrap' }}>
          {[{ v: '50+', l: 'Schools Active' }, { v: '10,000+', l: 'Students Managed' }, { v: '₹50L+', l: 'Fees Processed' }, { v: '99.9%', l: 'Uptime SLA' }, { v: '4.9/5', l: 'Average Rating' }].map(s => (
            <div key={s.l} style={{ textAlign: 'center' }}>
              <p className="j" style={{ fontSize: 30, fontWeight: 800, color: 'white' }}>{s.v}</p>
              <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', marginTop: 4 }}>{s.l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ── */}
      <section id="features" style={{ padding: '90px 24px', maxWidth: 1140, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 60 }}>
          <p style={{ fontSize: 12, color: '#818CF8', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 10 }}>EVERYTHING YOU NEED</p>
          <h2 className="j" style={{ fontSize: 42, fontWeight: 800, marginBottom: 14, letterSpacing: '-0.02em' }}>One platform. Every feature.</h2>
          <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.45)', maxWidth: 520, margin: '0 auto' }}>Replace spreadsheets, paper registers, and WhatsApp groups with a single system</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
          {[
            { icon: '👨‍🎓', title: 'Student Management', desc: 'Digital admissions, photo ID cards with QR code, bulk Excel import, complete student profiles and history.', color: '#818CF8', badge: 'All Plans' },
            { icon: '✅', title: 'Smart Attendance', desc: 'One-click daily attendance. Instant SMS to parents when a student is absent. Monthly reports with insights.', color: '#34D399', badge: 'All Plans' },
            { icon: '🌐', title: 'School Website', desc: 'Launch a professional school website in minutes. 3 beautiful templates, custom colors, mobile-optimized.', color: '#38BDF8', badge: 'All Plans' },
            { icon: '🔔', title: 'Notice Board & SMS', desc: 'Post school notices and send bulk SMS to parents, teachers, or students. Class-specific targeting.', color: '#F472B6', badge: 'All Plans' },
            { icon: '💳', title: 'Online Fee Collection', desc: 'Accept UPI, card, and netbanking payments directly in your school account. Automatic receipts and late fines.', color: '#F59E0B', badge: 'Pro & Enterprise' },
            { icon: '📊', title: 'Exam & Results', desc: 'Schedule exams, enter marks, auto-calculate grades. Generate printable report cards as PDF.', color: '#A78BFA', badge: 'Pro & Enterprise' },
            { icon: '📱', title: 'Parent Mobile App', desc: 'Progressive Web App — parents install on Android or iOS. Real-time access to attendance, fees, and results.', color: '#34D399', badge: 'Pro & Enterprise' },
            { icon: '📚', title: 'Library System', desc: 'Complete book catalogue, issue and return tracking, overdue reminders via SMS.', color: '#FB923C', badge: 'Enterprise' },
            { icon: '👔', title: 'HR & Payroll', desc: 'Staff salary management, leave tracking, auto-calculated salary slips, PF and deductions.', color: '#F87171', badge: 'Enterprise' },
          ].map(f => {
            const bc = f.badge === 'All Plans' ? { bg: 'rgba(52,211,153,0.1)', c: '#34D399' } : f.badge === 'Pro & Enterprise' ? { bg: 'rgba(129,140,248,0.1)', c: '#818CF8' } : { bg: 'rgba(245,158,11,0.1)', c: '#F59E0B' }
            return (
              <div key={f.title} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, transition: 'transform 0.2s,box-shadow 0.2s', cursor: 'default' }}
                onMouseOver={e => { (e.currentTarget as HTMLElement).style.transform = 'translateY(-3px)'; (e.currentTarget as HTMLElement).style.boxShadow = `0 16px 40px ${f.color}18` }}
                onMouseOut={e => { (e.currentTarget as HTMLElement).style.transform = 'none'; (e.currentTarget as HTMLElement).style.boxShadow = 'none' }}>
                <div style={{ fontSize: 32, marginBottom: 14 }}>{f.icon}</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <h3 className="j" style={{ fontSize: 15, fontWeight: 700 }}>{f.title}</h3>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '3px 9px', borderRadius: 99, background: bc.bg, color: bc.c }}>{f.badge}</span>
                </div>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65 }}>{f.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: '80px 24px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 860, margin: '0 auto', textAlign: 'center' }}>
          <h2 className="j" style={{ fontSize: 40, fontWeight: 800, marginBottom: 12 }}>Up and running in minutes</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16, marginBottom: 56 }}>No technical knowledge required</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 32 }}>
            {[{ n: '01', title: 'Register your school', desc: 'Enter your school name and choose a unique subdomain. Takes under 2 minutes.', icon: '📝' }, { n: '02', title: 'Add your data', desc: 'Import students from Excel, configure fee structures, and invite teachers.', icon: '⚙️' }, { n: '03', title: 'Go live', desc: 'Mark attendance, collect fees, send notices. Everything works from day one.', icon: '🚀' }].map(s => (
              <div key={s.n} style={{ textAlign: 'center' }}>
                <div style={{ width: 60, height: 60, background: 'rgba(79,70,229,0.15)', border: '1px solid rgba(79,70,229,0.3)', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 26 }}>{s.icon}</div>
                <p style={{ fontSize: 11, color: '#818CF8', letterSpacing: '0.1em', fontWeight: 600, marginBottom: 8 }}>STEP {s.n}</p>
                <h3 className="j" style={{ fontSize: 18, fontWeight: 700, marginBottom: 10 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" style={{ padding: '90px 24px', maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 50 }}>
          <h2 className="j" style={{ fontSize: 42, fontWeight: 800, marginBottom: 12 }}>Simple, honest pricing</h2>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 16 }}>All prices are final — no setup fees, no hidden charges</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {plans.map(plan => {
            const savings = getSavings(plan.id as PlanId)
            return (
              <div key={plan.id} style={{ background: plan.highlighted ? 'linear-gradient(160deg,rgba(79,70,229,0.2),rgba(124,58,237,0.1))' : 'rgba(255,255,255,0.03)', border: plan.highlighted ? '1.5px solid rgba(129,140,248,0.5)' : '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: '28px 24px', display: 'flex', flexDirection: 'column', position: 'relative', boxShadow: plan.highlighted ? '0 0 50px rgba(99,102,241,0.2)' : 'none' }}>
                {plan.highlighted && <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', color: 'white', fontSize: 12, fontWeight: 700, padding: '4px 16px', borderRadius: 99, whiteSpace: 'nowrap' }}>MOST POPULAR</div>}
                <h3 className="j" style={{ fontSize: 20, fontWeight: 800, marginBottom: 4, color: plan.color }}>{plan.name}</h3>
                <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 18 }}>{plan.tagline}</p>
                <div style={{ marginBottom: 6 }}>
                  <span className="j" style={{ fontSize: 38, fontWeight: 800 }}>₹{plan.monthlyPrice.toLocaleString('en-IN')}</span>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)' }}>/month</span>
                </div>
                {savings > 0 && <p style={{ fontSize: 12, color: '#34D399', marginBottom: 18 }}>Save ₹{savings.toLocaleString('en-IN')} with annual billing</p>}
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 20, display: 'flex', gap: 12 }}>
                  <span>👤 {plan.maxStudents === -1 ? 'Unlimited' : `${plan.maxStudents} students`}</span>
                  <span>👨‍🏫 {plan.maxTeachers === -1 ? 'Unlimited' : `${plan.maxTeachers} teachers`}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, marginBottom: 24, flex: 1 }}>
                  {plan.features.slice(0, 7).map(f => (
                    <li key={f} style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginBottom: 8, display: 'flex', gap: 8, lineHeight: 1.5 }}>
                      <span style={{ color: '#34D399', flexShrink: 0 }}>✓</span>{f.replace('✓ ', '')}
                    </li>
                  ))}
                </ul>
                <Link href="/register" style={{ display: 'block', textAlign: 'center', padding: '13px', borderRadius: 10, fontWeight: 700, fontSize: 14, background: plan.highlighted ? 'linear-gradient(135deg,#4F46E5,#7C3AED)' : 'transparent', color: 'white', border: plan.highlighted ? 'none' : `1.5px solid ${plan.color}`, transition: 'opacity 0.15s' }}
                  onMouseOver={e => (e.currentTarget as HTMLElement).style.opacity = '0.85'} onMouseOut={e => (e.currentTarget as HTMLElement).style.opacity = '1'}>
                  Start Free Trial →
                </Link>
              </div>
            )
          })}
        </div>
        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.25)', fontSize: 13, marginTop: 24 }}>
          15-day free trial on all plans · Secure payments by Razorpay · Annual billing saves up to 2 months
        </p>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: '80px 24px', background: 'rgba(255,255,255,0.02)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 50 }}>
            <h2 className="j" style={{ fontSize: 40, fontWeight: 800, marginBottom: 8 }}>Trusted by school leaders</h2>
            <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginBottom: 6 }}>{[1, 2, 3, 4, 5].map(i => <span key={i} style={{ color: '#F59E0B', fontSize: 18 }}>★</span>)}</div>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>4.9 / 5 from 50+ verified schools</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 16 }}>
            {[
              { name: 'Principal R. Sharma', school: 'Modern Public School, Ambikapur', text: 'Attendance and fee management used to take hours every day. Now it takes minutes. Parents receive instant SMS when their child is absent — they love the transparency.' },
              { name: 'Mrs. D. Verma', school: 'St. Mary Convent School, Surguja', text: 'Online fee collection has been transformational. Parents pay from home, receipts are generated automatically, and our accounts team has a complete digital record of every transaction.' },
              { name: 'Admin Head, DPS Bilaspur', school: 'Delhi Public School, Bilaspur', text: 'The exam results module is excellent. Teachers enter marks, the system calculates grades, and report cards are ready as PDFs. What used to take a week now takes an afternoon.' },
              { name: 'School Owner', school: 'Sunflower Academy, Raipur', text: 'We decided to subscribe within the first week of the trial. The school website alone is worth the subscription — professional design that we could never afford from an agency.' },
              { name: 'Vice Principal K. Singh', school: 'Nav Bharat School, Korba', text: 'Parent communication is so much better now. Notice board with SMS blast means no parent can claim they didn\'t receive information. Complaints dropped to zero.' },
              { name: 'Accounts Manager', school: 'Kendriya Model School', text: 'The fee management system is comprehensive — late fines calculate automatically, discount structures work perfectly, and the collection reports are exactly what our management needs.' },
            ].map((t, i) => (
              <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24 }}>
                <div style={{ display: 'flex', gap: 2, marginBottom: 14 }}>{[1, 2, 3, 4, 5].map(j => <span key={j} style={{ color: '#F59E0B', fontSize: 13 }}>★</span>)}</div>
                <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', lineHeight: 1.75, marginBottom: 18, fontStyle: 'italic' }}>"{t.text}"</p>
                <div>
                  <p className="j" style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>{t.name}</p>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{t.school}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section style={{ padding: '80px 24px', maxWidth: 740, margin: '0 auto' }}>
        <h2 className="j" style={{ fontSize: 40, fontWeight: 800, textAlign: 'center', marginBottom: 48 }}>Frequently Asked Questions</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { q: 'Do I need technical knowledge to set up the platform?', a: 'None at all. If you can use WhatsApp, you can use Shivshakti School Suite. Our onboarding takes under an hour, and our support team guides you through setup in Hindi or English.' },
            { q: 'Is my school\'s data secure?', a: 'Absolutely. Data is stored on encrypted servers with daily backups. Every school\'s data is completely isolated from others. HTTPS encryption is enforced on all connections.' },
            { q: 'Can the platform work with slow internet?', a: 'Yes. The app works offline for core features like attendance. Data syncs automatically when the connection is restored. This is especially useful in areas with intermittent connectivity.' },
            { q: 'How does online fee payment work for my school?', a: 'Pro and Enterprise schools connect their own Razorpay account. When parents pay fees, the money goes directly to your school\'s bank account. We never touch your fee collection.' },
            { q: 'What happens after my free trial ends?', a: 'You\'ll receive a reminder 7 days before your trial expires. After expiry, you can subscribe from the admin portal to continue. Your data is retained for 30 days even after expiry.' },
            { q: 'Can I upgrade or downgrade my plan?', a: 'You can upgrade anytime. When you upgrade mid-period, you receive a prorated credit for unused days — you never pay twice. Downgrades take effect at the end of your current billing period.' },
            { q: 'Do you provide GST invoices?', a: 'Yes. GST invoices are automatically sent to your registered email upon every payment. Our billing system is designed for business compliance.' },
          ].map((f, i) => (
            <details key={i} style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
              <summary style={{ padding: '16px 20px', cursor: 'pointer', fontSize: 15, fontWeight: 600, color: 'rgba(255,255,255,0.85)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', userSelect: 'none' }}>
                {f.q}
                <span style={{ color: '#818CF8', fontSize: 18, flexShrink: 0, marginLeft: 12 }}>+</span>
              </summary>
              <div style={{ padding: '0 20px 18px', fontSize: 14, color: 'rgba(255,255,255,0.5)', lineHeight: 1.75 }}>{f.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ padding: '90px 24px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 400, background: 'radial-gradient(ellipse, rgba(79,70,229,0.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', maxWidth: 600, margin: '0 auto' }}>
          <h2 className="j" style={{ fontSize: 'clamp(32px,5vw,52px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 16 }}>Start managing your school better, today.</h2>
          <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)', marginBottom: 36, lineHeight: 1.7 }}>
            15-day free trial. No credit card. No commitment.<br />Full access to all features during your trial.
          </p>
          <Link href="/register" style={{ display: 'inline-block', background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', color: 'white', fontWeight: 700, fontSize: 17, padding: '16px 48px', borderRadius: 14, boxShadow: '0 8px 36px rgba(79,70,229,0.5)' }}>
            Register Your School — Free →
          </Link>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.25)', marginTop: 16 }}>Join 50+ schools already on the platform</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '48px 24px 32px' }}>
        <div style={{ maxWidth: 1140, margin: '0 auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 48 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 30, height: 30, background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }} className="j">S</div>
                <span className="j" style={{ fontWeight: 700, fontSize: 14, color: 'white' }}>Shivshakti School Suite</span>
              </div>
              <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', lineHeight: 1.7, maxWidth: 260, marginBottom: 16 }}>
                School management software built for Indian schools. MSME & ISO registered. Based in Ambikapur, Chhattisgarh.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['MSME', 'ISO 9001', 'NSDC'].map(b => <span key={b} style={{ fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 99, border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.35)' }}>{b}</span>)}
              </div>
            </div>
            {[
              { title: 'Product', links: [['Features', '#features'], ['Pricing', '#pricing'], ['Start Free Trial', '/register'], ['Sign In', '/login']] },
              { title: 'Company', links: [['About Us', '/about'], ['Contact', '/contact'], ['Privacy Policy', '/privacy'], ['Terms of Service', '/terms']] },
              { title: 'Support', links: [['WhatsApp', 'https://wa.me/917477036832'], ['Call Us', 'tel:+917477036832'], ['Email', 'mailto:shivshakticomputeracademy25@gmail.com'], ['Documentation', '#']] },
            ].map(col => (
              <div key={col.title}>
                <p className="j" style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', color: 'rgba(255,255,255,0.5)', marginBottom: 16, textTransform: 'uppercase' }}>{col.title}</p>
                {col.links.map(([l, h]) => (
                  <a key={l} href={h} style={{ display: 'block', fontSize: 13, color: 'rgba(255,255,255,0.35)', marginBottom: 10, transition: 'color 0.15s' }}
                    onMouseOver={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.75)')} onMouseOut={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.35)')}>{l}</a>
                ))}
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>© {new Date().getFullYear()} Shivshakti Computer Academy. All rights reserved.</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>Payments secured by Razorpay · HTTPS encrypted</p>
          </div>
        </div>
      </footer>
    </div>
  )
}