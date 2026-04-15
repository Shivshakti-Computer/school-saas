// FILE: src/hooks/useAcademicSettings.ts
// ═══════════════════════════════════════════════════════════
// ✅ NEW: Client-side hook for academic settings
// Features:
// - localStorage cache (5 min TTL)
// - BroadcastChannel for cross-tab sync
// - Auto-refresh on settings update
// ═══════════════════════════════════════════════════════════

'use client'

import { useState, useEffect, useCallback } from 'react'
import type { IAcademicConfig } from '@/types/settings'

interface AcademicSettingsCache {
    data: IAcademicConfig
    timestamp: number
}

const CACHE_KEY = 'academic-settings-cache'
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export function useAcademicSettings(initialData?: IAcademicConfig) {
    const [settings, setSettings] = useState<IAcademicConfig | null>(
        initialData || null
    )
    const [loading, setLoading] = useState(!initialData)

    // ── Load from localStorage cache ──
    const loadFromCache = useCallback((): IAcademicConfig | null => {
        try {
            const cached = localStorage.getItem(CACHE_KEY)
            if (!cached) return null

            const parsed: AcademicSettingsCache = JSON.parse(cached)
            const isExpired = Date.now() - parsed.timestamp > CACHE_DURATION

            if (isExpired) {
                localStorage.removeItem(CACHE_KEY)
                return null
            }

            return parsed.data
        } catch (err) {
            console.error('[useAcademicSettings] Cache load failed', err)
            return null
        }
    }, [])

    // ── Save to localStorage cache ──
    const saveToCache = useCallback((data: IAcademicConfig) => {
        try {
            const cache: AcademicSettingsCache = {
                data,
                timestamp: Date.now(),
            }
            localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
        } catch (err) {
            console.error('[useAcademicSettings] Cache save failed', err)
        }
    }, [])

    // ── Fetch from API ──
    const fetchSettings = useCallback(async (): Promise<IAcademicConfig | null> => {
        setLoading(true)
        try {
            const res = await fetch('/api/settings')
            if (!res.ok) throw new Error('Failed to fetch settings')

            const data = await res.json()
            const academic = data.academic as IAcademicConfig

            setSettings(academic)
            saveToCache(academic)

            return academic
        } catch (err) {
            console.error('[useAcademicSettings] Fetch failed', err)
            return null
        } finally {
            setLoading(false)
        }
    }, [saveToCache])

    // ── Initial load ──
    useEffect(() => {
        if (initialData) {
            saveToCache(initialData)
            return
        }

        const cached = loadFromCache()
        if (cached) {
            setSettings(cached)
            setLoading(false)
        } else {
            fetchSettings()
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    // ── Listen to BroadcastChannel (cross-tab sync) ──
    useEffect(() => {
        const channel = new BroadcastChannel('settings-update')

        channel.onmessage = (event) => {
            if (event.data.type === 'academic-updated') {
                console.log('[useAcademicSettings] Settings updated, refreshing...')
                const newData = event.data.data as IAcademicConfig
                setSettings(newData)
                saveToCache(newData)
            }
        }

        return () => channel.close()
    }, [saveToCache])

    // ── Listen to storage events (cross-tab via localStorage) ──
    useEffect(() => {
        const handleStorageChange = (e: StorageEvent) => {
            if (e.key === CACHE_KEY && e.newValue) {
                try {
                    const parsed: AcademicSettingsCache = JSON.parse(e.newValue)
                    setSettings(parsed.data)
                } catch (err) {
                    console.error(
                        '[useAcademicSettings] Storage event parse failed',
                        err
                    )
                }
            }
        }

        window.addEventListener('storage', handleStorageChange)
        return () => window.removeEventListener('storage', handleStorageChange)
    }, [])

    return {
        settings,
        loading,
        refetch: fetchSettings,
    }
}