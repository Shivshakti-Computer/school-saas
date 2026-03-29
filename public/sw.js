// =============================================================
// FILE: public/sw.js — Service Worker
// School-specific caching strategy
// =============================================================
 
const CACHE_NAME = 'vidyaflow-v1'
 
// Install — basic shell cache karo
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll([
        '/offline',
        '/icons/icon-192x192.png',
        '/icons/icon-512x512.png',
      ]).catch(err => {
        // Icons missing hone pe fail mat karo
        console.warn('[SW] Partial cache:', err)
      })
    })
  )
  self.skipWaiting()
})
 
// Activate — purana cache saaf karo
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})
 
// Fetch — Network first, cache fallback
self.addEventListener('fetch', event => {
  const req = event.request
  const url = new URL(req.url)
 
  // Non-GET, API calls, Next.js internals — skip SW
  if (req.method !== 'GET')                return
  if (url.pathname.startsWith('/api/'))    return
  if (url.pathname.startsWith('/_next/'))  return
  if (url.pathname.startsWith('/sw.js'))   return
 
  event.respondWith(
    fetch(req)
      .then(res => {
        // Successful response — cache karo (dashboard pages)
        if (res.status === 200 && res.type === 'basic') {
          const clone = res.clone()
          caches.open(CACHE_NAME).then(c => c.put(req, clone))
        }
        return res
      })
      .catch(() =>
        // Offline — cache se serve karo
        caches.match(req).then(cached => {
          if (cached) return cached
          // HTML request aur cache miss — offline page dikhao
          if (req.headers.get('Accept')?.includes('text/html')) {
            return caches.match('/offline')
          }
          // Non-HTML miss — browser handle karega
          return new Response('Network error', { status: 408 })
        })
      )
  )
})
 
// Push notification handler
self.addEventListener('push', event => {
  if (!event.data) return
 
  let data = {}
  try { data = event.data.json() } catch { data = { title: 'Notification', body: event.data.text() } }
 
  const { title = 'School Suite', body = '', url = '/', tag = 'default' } = data
 
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      tag,
      icon:  '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      data:  { url },
      vibrate: [100, 50, 100],
    })
  )
})
 
// Notification click — URL pe navigate karo
self.addEventListener('notificationclick', event => {
  event.notification.close()
  const url = event.notification.data?.url ?? '/'
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(list => {
        const existing = list.find(c => c.url.includes(url))
        if (existing) return existing.focus()
        return clients.openWindow(url)
      })
  )
})
 