// src/app/offline/page.tsx
'use client' // <--- Ye line add karne se error fix ho jayega

export default function OfflinePage() {
    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            minHeight: '100vh', padding: 20, textAlign: 'center'
        }}>
            <h1 style={{ fontSize: 48, marginBottom: 8 }}>📡</h1>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
                You're Offline
            </h2>
            <p style={{ color: '#64748B', maxWidth: 400 }}>
                Please check your internet connection and try again.
            </p>
            <button
                onClick={() => window.location.reload()}
                style={{
                    marginTop: 20, padding: '10px 24px',
                    background: '#4F46E5', color: 'white',
                    borderRadius: 8, border: 'none', cursor: 'pointer'
                }}
            >
                Retry
            </button>
        </div>
    )
}