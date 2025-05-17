self.addEventListener("install", (event) => {
  console.log("Dev Service Worker installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Dev Service Worker activated");
  event.waitUntil(self.clients.claim());
});
