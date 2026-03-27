'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export function Portal({ children }: { children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
        return () => setMounted(false)
    }, [])

    if (!mounted) return null

    return createPortal(
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 99999,
                pointerEvents: 'none',
            }}
        >
            <div style={{ pointerEvents: 'auto', width: '100%', height: '100%' }}>
                {children}
            </div>
        </div>,
        document.body
    )
}