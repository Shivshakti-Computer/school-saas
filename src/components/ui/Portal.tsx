// FILE: src/components/ui/Portal.tsx
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

    // ✅ Seedha document.body me render — koi wrapper div nahi
    // Children khud apna positioning handle karte hain
    return createPortal(children, document.body)
}