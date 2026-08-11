/**
 * Offline support for the gym: phones lose coverage between the weights, and both
 * the trainer and the client need to keep reading what they already opened.
 *
 * Nothing is ever written from here. Weigh-ins and every other POST go straight to
 * the network, so the client is told plainly when a save could not be sent.
 */

const VERSION = "v1";
const SHELL_CACHE = `josema-shell-${VERSION}`;
const ASSET_CACHE = `josema-assets-${VERSION}`;
const DATA_CACHE = `josema-data-${VERSION}`;
const CURRENT_CACHES = [SHELL_CACHE, ASSET_CACHE, DATA_CACHE];

const OFFLINE_URL = "/offline";
/** A gym's worth of signal: better to show yesterday's plan than to spin forever. */
const NETWORK_TIMEOUT_MS = 3500;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        cache.add(new Request(OFFLINE_URL, { cache: "reload" })),
      ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(
          names
            .filter(
              (name) =>
                name.startsWith("josema-") && !CURRENT_CACHES.includes(name),
            )
            .map((name) => caches.delete(name)),
        ),
      )
      // Take over pages loaded before this worker existed, so the very first
      // visit already fills the caches instead of the second one.
      .then(() => self.clients.claim()),
  );
});

function fetchWithTimeout(request) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);

  return fetch(request, { signal: controller.signal }).finally(() =>
    clearTimeout(timer),
  );
}

/** A redirected response cannot be replayed for a navigation — the browser rejects it. */
function isCacheable(response) {
  return response.ok && !response.redirected && response.type === "basic";
}

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);

  try {
    const response = await fetchWithTimeout(request);
    if (isCacheable(response)) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }
    if (fallbackUrl) {
      const fallback = await caches.match(fallbackUrl);
      if (fallback) {
        return fallback;
      }
    }
    return new Response("Sin conexión", {
      status: 503,
      statusText: "Sin conexión",
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }
}

/** For fingerprinted assets and exercise pictures: they never change under the same URL. */
async function cacheFirst(request, cacheName) {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  const response = await fetch(request);
  if (isCacheable(response)) {
    const cache = await caches.open(cacheName);
    await cache.put(request, response.clone());
  }
  return response;
}

function isAsset(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/icons/") ||
    // Exercise images, proxied to the backend.
    pathname.startsWith("/static/")
  );
}

/**
 * Session calls must never be answered from a cache — a logged out trainer would
 * look logged in — and exports are big one-off downloads worth no cache space.
 */
function isCacheableApiCall(pathname) {
  return (
    pathname.startsWith("/api/") &&
    !pathname.startsWith("/api/auth/") &&
    !pathname.includes("/export/")
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;

  if (request.method !== "GET") {
    return;
  }

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request, SHELL_CACHE, OFFLINE_URL));
    return;
  }

  // Tapping a link does not navigate: Next fetches the route payload instead.
  // Without this, moving between screens offline would fail and only recover
  // after the browser gave up and reloaded the whole page.
  if (url.searchParams.has("_rsc")) {
    event.respondWith(networkFirst(request, SHELL_CACHE));
    return;
  }

  if (isAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, ASSET_CACHE));
    return;
  }

  if (isCacheableApiCall(url.pathname)) {
    event.respondWith(networkFirst(request, DATA_CACHE));
  }
});

/**
 * Signing out has to wipe what was read while signed in: otherwise a phone in
 * flight mode would still show the trainer's clients from the cache. The offline
 * page survives — it holds nothing personal and cannot be precached again.
 */
async function clearPrivateCaches() {
  await caches.delete(DATA_CACHE);

  const shell = await caches.open(SHELL_CACHE);
  const entries = await shell.keys();
  await Promise.all(
    entries
      .filter((entry) => new URL(entry.url).pathname !== OFFLINE_URL)
      .map((entry) => shell.delete(entry)),
  );
}

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "CLEAR_PRIVATE_CACHES") {
    event.waitUntil(clearPrivateCaches());
  }
});
