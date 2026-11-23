self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {}

  event.waitUntil(
    self.registration.showNotification(data.title || 'Campus Profiles', {
      body: data.body || 'You have a new update',
      icon: '/api/pwa-icon?size=192',
      badge: '/api/pwa-icon?size=96',
      data: { url: data.url || '/admin/dashboard' },
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/admin/dashboard'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes('/admin') && 'focus' in client) {
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})