const CACHE_NAME = "ubumihealth-cache-v1";
const ASSETS_TO_CACHE = [
  "./",
  "./index.html",
  "./siteplan.html",
  "./css/siteplan.css",
  "./js/main.js",
  "./js/Store.mjs",
  "./js/HealthDataService.mjs",
  "./js/VitalsTracker.mjs",
  "./js/SymptomScreener.mjs",
  "./js/TelehealthFHIRService.mjs",
  "./js/AnalyticsSyncEngine.mjs",
  "./js/AccessibilityAudioService.mjs",
  "./json/pediatric_diet.json",
  "./json/screening_rules.json",
  "./json/tb_hiv_screening_rules.json"
];

// I cache the app shell and clinical datasets during installation
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[Service Worker] I am caching app shell and clinical rulesets.");
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

// I clean up outdated caches during activation
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("[Service Worker] I am removing old cache version:", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// I intercept network requests using a cache-first strategy with network fallback
self.addEventListener("fetch", (event) => {
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          if (event.request.method === "GET" && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        });
      }).catch(() => {
        if (event.request.headers.get("accept").includes("text/html")) {
          return caches.match("./index.html");
        }
      });
    })
  );
});