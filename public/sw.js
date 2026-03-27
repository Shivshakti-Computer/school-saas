// FILE: public/sw.js — Service Worker (complete)
const CACHE_VERSION = 'v1'
const STATIC_CACHE = `static-${CACHE_VERSION}`
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`

const STATIC_ASSETS = [
  '/',
  '/login',
  '/offline',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// ── Install ──────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(cache => {
      return cache.addAll(STATIC_ASSETS).catch(err => {
        console.warn('[SW] Failed to cache some assets:', err)
      })
    })
  )
  self.skipWaiting()
})

// ── Activate ─────────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(k => k !== STATIC_CACHE && k !== DYNAMIC_CACHE)
          .map(k => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch — Network first, cache fallback ────────────────────
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET and API requests
  if (request.method !== 'GET') return
  if (url.pathname.startsWith('/api/')) return
  if (url.pathname.startsWith('/_next/')) return

  // Attendance pages — cache for offline use
  if (url.pathname.includes('/attendance')) {
    event.respondWith(
      fetch(request)
        .then(res => {
          const clone = res.clone()
          caches.open(DYNAMIC_CACHE).then(c => c.put(request, clone))
          return res
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // Default: network first
  event.respondWith(
    fetch(request)
      .then(res => {
        if (res.status === 200) {
          const clone = res.clone()
          caches.open(DYNAMIC_CACHE).then(c => c.put(request, clone))
        }
        return res
      })
      .catch(() =>
        caches.match(request).then(cached =>
          cached || caches.match('/offline')
        )
      )
  )
})

// ── Push Notification handler ─────────────────────────────────
self.addEventListener('push', event => {
  if (!event.data) return

  let payload
  try {
    payload = event.data.json()
  } catch {
    payload = { title: 'New Notification', body: event.data.text() }
  }

  const {
    title = 'Shivshakti School Suite',
    body = '',
    icon = '/icons/icon-192x192.png',
    badge = '/icons/badge-72x72.png',
    data = {},
    tag = 'default',
  } = payload

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge,
      tag,
      data,
      vibrate: [100, 50, 100],
      requireInteraction: payload.requireInteraction ?? false,
      actions: payload.actions ?? [],
    })
  )
})

// ── Notification click ────────────────────────────────────────
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      // Focus existing window if open
      const existing = clientList.find(c => c.url.includes(url))
      if (existing) return existing.focus()
      return clients.openWindow(url)
    })
  )
})

// ── Background sync (offline attendance) ─────────────────────
self.addEventListener('sync', event => {
  if (event.tag === 'sync-attendance') {
    event.waitUntil(syncOfflineAttendance())
  }
})

async function syncOfflineAttendance() {
  // Read from IndexedDB and POST to API
  const db = await openOfflineDB()
  const tx = db.transaction('attendance', 'readwrite')
  const store = tx.objectStore('attendance')
  const records = await getAllRecords(store)

  for (const record of records) {
    try {
      const res = await fetch('/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record.data),
      })
      if (res.ok) {
        await store.delete(record.id)
      }
    } catch {
      // Will retry on next sync
    }
  }
}

// Simple IndexedDB helpers
function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('shivshakti-offline', 1)
    req.onupgradeneeded = e => {
      const db = (e.target).result
      if (!db.objectStoreNames.contains('attendance')) {
        db.createObjectStore('attendance', { keyPath: 'id', autoIncrement: true })
      }
    }
    req.onsuccess = e => resolve((e.target).result)
    req.onerror = () => reject(req.error)
  })
}

function getAllRecords(store) {
  return new Promise((resolve, reject) => {
    const req = store.getAll()
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}