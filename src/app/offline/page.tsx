// =============================================================
// FILE: src/app/offline/page.tsx — Offline fallback page
// =============================================================

export default function OfflinePage() {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', fontFamily: 'sans-serif', textAlign: 'center', padding: 24 }}>
            <div>
                <div style={{ fontSize: 64, marginBottom: 16 }}>📡</div>
                <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>You're offline</h1>
                <p style={{ color: '#64748B', fontSize: 15, marginBottom: 24 }}>
                    Check your internet connection and try again.
                    <br />Some features may still be available.
                </p>
                <button
                    onClick={() => window.location.reload()}
                    style={{ padding: '10px 24px', background: '#4F46E5', color: 'white', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}
                >
                    Try Again
                </button>
            </div>
        </div>
    )
}