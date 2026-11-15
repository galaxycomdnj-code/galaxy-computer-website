
const CACHE_NAME = "galaxy-admin-v1";

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  // Admin panel ও Supabase-এর তথ্য ক্যাশ করা হবে না।
});
