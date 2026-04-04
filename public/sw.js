self.addEventListener("push", function (event) {
  if (event.data) {
    const data = event.data.json();
    const { title, body, url } = data;
    const options = {
      body,
      icon: "/logo.png",
      badge: "/logo.png",
      vibrate: [100, 50, 100],
      data: { url: url || "/" },
    };
    event.waitUntil(self.registration.showNotification(title, options));
  }
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const url = event.notification.data?.url || "/";
  event.waitUntil(clients.openWindow(url));
});
