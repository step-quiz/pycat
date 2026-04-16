// ════════════════════════════════════════════════════════
// sw-register.js — Registra el Service Worker i mostra
//                  l'indicador "Disponible sense connexió"
//
// Bypass de desenvolupament: no es registra si hostname és
// 'localhost', '127.0.0.1' o '0.0.0.0', o si la URL conté
// ?nosw=1. Això evita que el cache interfereixi mentre es
// desenvolupa.
//
// Si es detecta un SW registrat en aquests entorns (p.ex.
// d'una sessió anterior), es desregistra automàticament.
// ════════════════════════════════════════════════════════

(function() {
  if (!('serviceWorker' in navigator)) return;

  var params   = new URLSearchParams(location.search);
  var hostname = location.hostname;
  var isDev    = hostname === 'localhost' ||
                 hostname === '127.0.0.1' ||
                 hostname === '0.0.0.0' ||
                 params.get('nosw') === '1';

  // En mode desenvolupament: desregistra qualsevol SW previ
  if (isDev) {
    navigator.serviceWorker.getRegistrations().then(function(regs) {
      regs.forEach(function(r) { r.unregister(); });
    });
    return;
  }

  // Determina la ruta al sw.js segons si estem a /curs/ o a l'arrel
  var swPath = location.pathname.indexOf('/curs/') !== -1 ? '../sw.js' : 'sw.js';
  var swScope = location.pathname.indexOf('/curs/') !== -1 ? '../' : './';

  // Registra el SW quan la pàgina ja s'ha carregat (no ralentitzem la càrrega)
  window.addEventListener('load', function() {
    navigator.serviceWorker.register(swPath, { scope: swScope }).then(function(reg) {
      // Demana a l'SW si ja té Pyodide cachejat
      if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'checkOfflineStatus' });
      } else if (reg.active) {
        reg.active.postMessage({ type: 'checkOfflineStatus' });
      }
    }).catch(function(err) {
      console.warn('[pycat] Service Worker no registrat:', err);
    });
  });

  // Escolta missatges del SW (offline-ready)
  navigator.serviceWorker.addEventListener('message', function(e) {
    if (!e.data) return;
    if (e.data.type === 'pycat-offline-ready' ||
        (e.data.type === 'pycat-offline-status' && e.data.ready)) {
      _showOfflineIndicator();
    }
  });

  // ── Indicador "Disponible sense connexió" ──
  function _showOfflineIndicator() {
    if (document.getElementById('offline-indicator')) return;   // ja mostrat

    // Text traduïble — utilitza P.t() si està disponible
    var text;
    if (typeof P !== 'undefined' && typeof P.t === 'function') {
      text = P.t('ui.offline_ready');
    } else {
      // Fallback: detecta idioma per meta si P.t no està disponible
      var lang = (document.documentElement.lang || 'ca').toLowerCase();
      if (lang.indexOf('es') === 0)      text = '✓ Disponible sin conexión';
      else if (lang.indexOf('en') === 0) text = '✓ Available offline';
      else                               text = '✓ Disponible sense connexió';
    }

    var el = document.createElement('div');
    el.id = 'offline-indicator';
    el.textContent = text;
    el.setAttribute('role', 'status');
    document.body.appendChild(el);

    // Desapareix després de 4 segons
    setTimeout(function() {
      el.classList.add('fade');
      setTimeout(function() {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 400);
    }, 4000);
  }
})();
