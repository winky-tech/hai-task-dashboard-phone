self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = { title: "Task Dashboard", body: "Your dashboard has an update." };
  }

  event.waitUntil(
    self.registration.showNotification(payload.title || "Task Dashboard", {
      body: payload.body || "Your dashboard has an update.",
      icon: "./icon-192.png",
      badge: "./icon-192.png",
      tag: payload.tag || "hai-dashboard",
      renotify: true,
      silent: payload.silent === true,
      ...(payload.payoutStage ? { vibrate: [80, 60, 80, 60, 180] } : {}),
      data: { url: payload.url || "./" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "./", self.location.href).href;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      const existing = windows.find((client) => client.url === target);
      return existing ? existing.focus() : clients.openWindow(target);
    })
  );
});
