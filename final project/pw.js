const CACHE_NAME = "healthpulse-v1";
const ASSETS = [
  "./",
  "./index.html",
  "./siteplan.html",
  "./css/style.css",
  "./src/js/main.js",
  "./src/js/Store.mjs",
  "./src/js/utils.mjs",
  "./src/js/PreferencesManager.mjs",
  "./src/js/VitalsTracker.mjs",
  "./src/js/SymptomScreener.mjs",
  "./src/js/TelehealthFHIRService.mjs",
  "./src/js/HealthDataService.mjs"
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener("fetch", (e) => {
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});