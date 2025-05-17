import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import {
  NetworkFirst,
  CacheFirst,
  StaleWhileRevalidate,
} from "workbox-strategies";

// Precaching aplikasi
precacheAndRoute(self.__WB_MANIFEST);
// Strategi caching runtime
registerRoute(
  ({ url }) =>
    url.origin === "https://fonts.googleapis.com" ||
    url.origin === "https://fonts.gstatic.com",
  new CacheFirst({
    cacheName: "google-fonts",
  })
);

registerRoute(
  ({ url }) => url.origin.includes("fontawesome"),
  new CacheFirst({
    cacheName: "font-awesome",
  })
);

registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkFirst({
    cacheName: "api-cache",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

registerRoute(
  ({ request }) => request.destination === "image",
  new StaleWhileRevalidate({
    cacheName: "images",
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Event listeners untuk PWA
self.addEventListener("install", () => {
  self.skipWaiting();
  console.log("Service Worker installed");
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
  console.log("Service Worker activated");
});

// Push Notification
self.addEventListener("push", (event) => {
  console.log("Push event received:", event);

  const BASE_PATH = self.registration.scope
    .replace(location.origin, "")
    .replace(/\/$/, "");

  let data = {};
  try {
    data = event.data.json();
  } catch (e) {
    data = {
      title: "New Notification",
      body: "You have a new notification",
      icon: `${BASE_PATH}/icons/icon-192x192.png`,
    };
  }

  const options = {
    body: data.body || "You have a new notification",
    icon: data.icon || `${BASE_PATH}/icons/icon-192x192.png`,
    badge: `${BASE_PATH}/icons/badge-72x72.png`,
    data: {
      url: data.url || `${BASE_PATH}/`,
    },
  };

  event.waitUntil(
    self.registration.showNotification(
      data.title || "New Notification",
      options
    )
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url || "/"));
});
