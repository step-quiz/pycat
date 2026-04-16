// ════════════════════════════════════════════════════════
// sw.js — Service Worker de PyCat (suport offline)
//
// Estratègia:
//   - Install: pre-cacheja els static assets locals (HTML, CSS, JS)
//   - Fetch:
//       · Assets de Pyodide (cdn.jsdelivr.net/pyodide/ o pyodide-cdn2.iodide.io/):
//         CACHE-FIRST (indefinidament). Invalidats canviant CACHE_VERSION.
//       · Static assets del mateix origen (.html, .css, .js):
//         CACHE-FIRST amb revalidació en segon pla (stale-while-revalidate).
//       · Resta: NETWORK-FIRST amb fallback al cache.
//   - Activate: esborra caches antigues.
//
// Invalidació:
//   Per invalidar tot el cache (p.ex. en actualitzar Pyodide), incrementa
//   CACHE_VERSION. El nou SW esborrarà les caches antigues al activate.
//
// Notificació offline-ready:
//   Un cop s'ha cachejat `pyodide.asm.wasm` (el fitxer més gran, ~8MB),
//   el SW envia un postMessage {type:'pycat-offline-ready'} a tots els
//   clients perquè mostrin un indicador.
//
// Bypass en desenvolupament:
//   El registre des del client es salta quan hostname és 'localhost',
//   '127.0.0.1' o '0.0.0.0' (veure sw-register.js).
// ════════════════════════════════════════════════════════

// ── Versió: canvia-la per invalidar tot el cache ─────────
// Format: 'v{N}-pyodide{VERSIO}'
const CACHE_VERSION = 'v1-pyodide0.27.7';
const CACHE_STATIC  = 'pycat-static-'  + CACHE_VERSION;
const CACHE_PYODIDE = 'pycat-pyodide-' + CACHE_VERSION;

// ── Static assets a pre-cachejar ─────────────────────────
// Rutes relatives al scope del SW (arrel del projecte).
const STATIC_ASSETS = [
  './',
  'index.html',
  'style.css',
  'js/constants.js',
  'js/i18n.js',
  'js/state.js',
  'js/console.js',
  'js/editor.js',
  'js/pyrunner.js',
  'js/pyworker.js',
  'js/ui.js',
  'js/kbd-accessory.js',
  'js/main.js',
  'curs/index.html',
  'curs/curs.css',
  'curs/capitols.js',
  'curs/glossari-data.js',
  // Capítols
  'curs/capitol-1.html',  'curs/capitol-2.html',  'curs/capitol-3.html',
  'curs/capitol-4.html',  'curs/capitol-5.html',  'curs/capitol-6.html',
  'curs/capitol-7.html',  'curs/capitol-8.html',  'curs/capitol-9.html',
  'curs/capitol-10.html',
  // Reptes
  'curs/repte-1.html',  'curs/repte-2.html',  'curs/repte-3.html',
  'curs/repte-4.html',  'curs/repte-5.html',  'curs/repte-6.html',
  'curs/repte-7.html',  'curs/repte-8.html',  'curs/repte-9.html',
  'curs/repte-10.html', 'curs/repte-11.html', 'curs/repte-12.html',
  'curs/repte-13.html', 'curs/repte-14.html', 'curs/repte-15.html',
];

// ── Hosts de Pyodide a cachejar ──────────────────────────
const PYODIDE_HOSTS = ['cdn.jsdelivr.net', 'pyodide-cdn2.iodide.io'];

function isPyodideRequest(url) {
  try {
    var u = new URL(url);
    if (!PYODIDE_HOSTS.includes(u.hostname)) return false;
    return u.pathname.indexOf('/pyodide/') === 0 ||
           u.pathname.indexOf('/v0.') !== -1;  // pyodide-cdn2 no té /pyodide/ a la ruta
  } catch(_) {
    return false;
  }
}

function isSameOriginStatic(url) {
  try {
    var u = new URL(url);
    if (u.origin !== self.location.origin) return false;
    // Només assets estàtics; els paràmetres query normalment no canvien l'asset
    return /\.(html|css|js)$/i.test(u.pathname) || u.pathname === '/' || u.pathname.endsWith('/');
  } catch(_) {
    return false;
  }
}


// ── INSTALL ──────────────────────────────────────────────
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_STATIC).then(function(cache) {
      // addAll falla sencer si una sola petició falla — els afegim un a un
      // per no caure sencer si algun fitxer no hi és (robustesa).
      return Promise.all(
        STATIC_ASSETS.map(function(url) {
          return cache.add(url).catch(function(err) {
            console.warn('[sw] No s\'ha pogut precachejar:', url, err);
          });
        })
      );
    }).then(function() {
      // Activa immediatament el nou SW sense esperar tancar pestanyes
      return self.skipWaiting();
    })
  );
});


// ── ACTIVATE ─────────────────────────────────────────────
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(key) {
        // Esborra caches d'altres versions
        if (key !== CACHE_STATIC && key !== CACHE_PYODIDE &&
            (key.indexOf('pycat-') === 0)) {
          return caches.delete(key);
        }
      }));
    }).then(function() {
      // Pren control de totes les pestanyes obertes
      return self.clients.claim();
    })
  );
});


// ── FETCH ────────────────────────────────────────────────
self.addEventListener('fetch', function(event) {
  var req = event.request;

  // Només GET
  if (req.method !== 'GET') return;

  var url = req.url;

  // ── 1) Pyodide: cache-first ───
  if (isPyodideRequest(url)) {
    event.respondWith(
      caches.match(req).then(function(cached) {
        if (cached) return cached;
        return fetch(req).then(function(resp) {
          // Només cachegem respostes vàlides o opaques (cross-origin sense CORS)
          if (resp && (resp.ok || resp.type === 'opaque')) {
            var respClone = resp.clone();
            caches.open(CACHE_PYODIDE).then(function(cache) {
              cache.put(req, respClone).then(function() {
                // Si aquest és el fitxer wasm gran, notifiquem als clients
                if (url.indexOf('pyodide.asm.wasm') !== -1) {
                  _notifyOfflineReady();
                }
              });
            });
          }
          return resp;
        });
      })
    );
    return;
  }

  // ── 2) Same-origin static: stale-while-revalidate ───
  if (isSameOriginStatic(url)) {
    event.respondWith(
      caches.match(req).then(function(cached) {
        var fetchPromise = fetch(req).then(function(resp) {
          if (resp && resp.ok) {
            var respClone = resp.clone();
            caches.open(CACHE_STATIC).then(function(cache) {
              cache.put(req, respClone);
            });
          }
          return resp;
        }).catch(function() {
          // Offline: retorna només la versió cachejada si existeix
          return cached;
        });
        return cached || fetchPromise;
      })
    );
    return;
  }

  // ── 3) Resta: network-first, fallback al cache ───
  event.respondWith(
    fetch(req).catch(function() {
      return caches.match(req);
    })
  );
});


// ── Notifica als clients que tot està cachejat per offline ──
function _notifyOfflineReady() {
  self.clients.matchAll({ type: 'window' }).then(function(clients) {
    clients.forEach(function(client) {
      client.postMessage({ type: 'pycat-offline-ready' });
    });
  });
}


// ── Missatges des del client ─────────────────────────────
self.addEventListener('message', function(event) {
  if (!event.data) return;
  if (event.data.type === 'skipWaiting') {
    self.skipWaiting();
  }
  if (event.data.type === 'checkOfflineStatus') {
    // El client demana si Pyodide ja està cachejat
    caches.open(CACHE_PYODIDE).then(function(cache) {
      return cache.keys().then(function(keys) {
        var hasWasm = keys.some(function(r) {
          return r.url.indexOf('pyodide.asm.wasm') !== -1;
        });
        if (event.source) {
          event.source.postMessage({
            type: 'pycat-offline-status',
            ready: hasWasm
          });
        }
      });
    });
  }
});
