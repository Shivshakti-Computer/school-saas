'use client'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export function Portal({ children }: { children: React.ReactNode }) {
    const [container, setContainer] = useState<HTMLElement | null>(null)

    useEffect(() => {
        // Create a dedicated container OUTSIDE everything
        const el = document.createElement('div')
        el.id = 'portal-root'
        el.style.position = 'fixed'
        el.style.inset = '0'
        el.style.zIndex = '2147483647' // max possible z-index
        el.style.pointerEvents = 'none'
        document.body.appendChild(el)
        setContainer(el)

        return () => {
            document.body.removeChild(el)
        }
    }, [])

    if (!container) return null

    return createPortal(
        <div style={{ pointerEvents: 'auto', width: '100%', height: '100%' }}>
            {children}
        </div>,
        container
    )
}