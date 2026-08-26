self.addEventListener("push", (event) => {
  const fallback = { title: "HeyLook", body: "You have a new notification.", url: "/" };
  let data = fallback;

  try {
    data = event.data ? { ...fallback, ...event.data.json() } : fallback;
  } catch (_) {
    data = event.data ? { ...fallback, body: event.data.text() } : fallback;
  }

  event.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: data.icon || "/pwa-192x192.png",
    badge: data.badge || "/pwa-192x192.png",
    data: { url: data.url || "/" },
    tag: data.tag || "heylook-notification",
    renotify: true,
  }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
    const existing = windowClients.find((client) => "focus" in client);
    if (existing) {
      existing.navigate(targetUrl);
      return existing.focus();
    }
    return clients.openWindow(targetUrl);
  }));
});
