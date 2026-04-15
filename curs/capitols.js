// ════════════════════════════════════════════════════════
// curs/capitols.js — Dades dels capítols i helpers de UI
//
// Funcions exportades al window global (idèntic a KarelCat):
//   injectCursLogo()           — pobla .logo-icon
//   renderSidebar(currentNum)  — omple #sidebar-nav (amb ✓ de progrés)
//   renderReptesSidebar(num)   — sidebar pels reptes (amb ✓ de progrés)
//   renderSimuladors()         — converteix .simulador → iframes
//   initSidebarToggle()        — hamburger mòbil
//   initGlossariCurs()         — glossari modal
//
// Dependència: glossari-data.js (ha de carregar-se ABANS)
// ════════════════════════════════════════════════════════


// ── Logo ─────────────────────────────────────────────────
function injectCursLogo() {
  document.querySelectorAll('.logo-icon').forEach(function(el) {
    if (!el.innerHTML.trim()) el.innerHTML = '🐍';
  });
}


// ── Dades dels capítols ──────────────────────────────────
// ESCALAR: afegir capítols aquí i crear el fitxer HTML corresponent.
// goalId: identificador del repte d'exercici del capítol (null si no en té).

var CAPITOLS_DATA = [
  { num: 1,  titol: 'Hola, Python!',              arxiu: 'capitol-1.html',  goalId: 'cap-1-ex' },
  { num: 2,  titol: 'Variables',                   arxiu: 'capitol-2.html',  goalId: null },
  { num: 3,  titol: 'Operacions i input',          arxiu: 'capitol-3.html',  goalId: 'cap-3-ex' },
  { num: 4,  titol: 'Decisions: if, elif, else',   arxiu: 'capitol-4.html',  goalId: 'cap-4-ex' },
  { num: 5,  titol: 'Repetir amb while',           arxiu: 'capitol-5.html',  goalId: 'cap-5-ex' },
  { num: 6,  titol: 'Repetir amb for i range',     arxiu: 'capitol-6.html',  goalId: 'cap-6-ex' },
  { num: 7,  titol: 'Treballant amb text',         arxiu: 'capitol-7.html',  goalId: 'cap-7-ex' },
  { num: 8,  titol: 'Llistes',                     arxiu: 'capitol-8.html',  goalId: 'cap-8-ex' },
  { num: 9,  titol: 'Funcions',                    arxiu: 'capitol-9.html',  goalId: 'cap-9-ex' },
  { num: 10, titol: 'Posant-ho tot junt',          arxiu: 'capitol-10.html', goalId: null },
  // ...afegir capítols aquí
];

var REPTES_DATA = [
  { num: 1,  titol: 'El primer programa',    arxiu: 'repte-1.html', goalId: 'repte-1' },
  // { num: 2,  titol: 'La suma',              arxiu: 'repte-2.html', goalId: 'repte-2' },
  // ...afegir reptes aquí
];


// ── Sistema de progrés ───────────────────────────────────
// Guarda a localStorage un objecte { goalId: true, ... }

var _LS_KEY = 'pycat_progress';

function getProgress() {
  try {
    return JSON.parse(localStorage.getItem(_LS_KEY) || '{}');
  } catch(_) { return {}; }
}

function saveGoalCompleted(goalId) {
  if (!goalId) return;
  var p = getProgress();
  if (p[goalId]) return;  // ja guardat
  p[goalId] = true;
  try { localStorage.setItem(_LS_KEY, JSON.stringify(p)); } catch(_) {}
}

function isGoalCompleted(goalId) {
  if (!goalId) return false;
  return !!getProgress()[goalId];
}


// ── Sidebar: capítols ────────────────────────────────────

function renderSidebar(currentNum) {
  var nav = document.getElementById('sidebar-nav');
  if (!nav) return;
  var progress = getProgress();

  var html = '<div class="sidebar-section-title">Capítols</div>';
  html += '<ul class="sidebar-list">';
  for (var i = 0; i < CAPITOLS_DATA.length; i++) {
    var c = CAPITOLS_DATA[i];
    var isActive = c.num === currentNum;
    var check = (c.goalId && progress[c.goalId]) ? '<span class="sidebar-check" aria-label="completat">✓</span>' : '';
    html += '<li class="sidebar-item' + (isActive ? ' active' : '') + '">' +
      '<a href="' + c.arxiu + '">' +
        check + c.num + '. ' + c.titol +
      '</a></li>';
  }
  html += '</ul>';
  nav.innerHTML = html;
}

// ── Sidebar: reptes ──────────────────────────────────────

function renderReptesSidebar(currentNum) {
  var nav = document.getElementById('sidebar-nav');
  if (!nav) return;
  var progress = getProgress();

  var html = '<div class="sidebar-section-title">Reptes</div>';
  html += '<ul class="sidebar-list">';
  for (var i = 0; i < REPTES_DATA.length; i++) {
    var r = REPTES_DATA[i];
    var isActive = r.num === currentNum;
    var check = (r.goalId && progress[r.goalId]) ? '<span class="sidebar-check" aria-label="completat">✓</span>' : '';
    html += '<li class="sidebar-item' + (isActive ? ' active' : '') + '">' +
      '<a href="' + r.arxiu + '">' +
        check + 'Repte ' + r.num + ': ' + r.titol +
      '</a></li>';
  }
  html += '</ul>';
  nav.innerHTML = html;
}


// ── Renderitzador de simuladors incrustats ────────────────

function renderSimuladors() {
  document.querySelectorAll('.simulador').forEach(function(div) {
    var code     = div.getAttribute('data-code') || '';
    var readonly = div.getAttribute('data-readonly') === 'true';
    var height   = div.getAttribute('data-height') || '320';
    var stdin    = div.getAttribute('data-stdin') || '';
    var expected = div.getAttribute('data-expected') || '';
    var tests    = div.getAttribute('data-tests') || '';
    var testcode = div.getAttribute('data-testcode') || '';
    var goalId   = div.getAttribute('data-goal-id') || '';

    var params = new URLSearchParams();
    params.set('embed', '1');
    params.set('theme', 'light');

    if (code)     params.set('code', btoa(unescape(encodeURIComponent(code))));
    if (readonly) params.set('readonly', '1');
    if (stdin)    params.set('stdin', btoa(unescape(encodeURIComponent(stdin))));
    if (expected) params.set('expected', btoa(unescape(encodeURIComponent(expected))));
    if (tests)    params.set('tests', btoa(unescape(encodeURIComponent(tests))));
    if (testcode) params.set('testcode', btoa(unescape(encodeURIComponent(testcode))));
    if (goalId)   params.set('goalId', goalId);

    var iframe = document.createElement('iframe');
    iframe.src = '../index.html?' + params.toString();
    iframe.style.width = '100%';
    iframe.style.height = height + 'px';
    iframe.style.border = '1px solid #d0d0d0';
    iframe.style.borderRadius = '8px';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    iframe.setAttribute('loading', 'lazy');

    div.innerHTML = '';
    div.appendChild(iframe);

    if (goalId) {
      var fb = document.createElement('div');
      fb.className = 'simulador-feedback';
      fb.setAttribute('data-goal-id', goalId);
      // Si ja s'ha completat, mostra el feedback positiu
      if (isGoalCompleted(goalId)) {
        fb.className = 'simulador-feedback fb-ok';
        fb.textContent = '✓ Completat anteriorment.';
      }
      div.appendChild(fb);
    }
  });
}


// ── Sidebar toggle (hamburger mòbil) ─────────────────────

function initSidebarToggle() {
  var toggle  = document.getElementById('sidebar-toggle');
  var sidebar = document.getElementById('sidebar');
  var overlay = document.getElementById('sidebar-overlay');
  if (!toggle || !sidebar) return;

  var open = function() {
    sidebar.classList.add('open');
    if (overlay) overlay.classList.add('visible');
    toggle.setAttribute('aria-expanded', 'true');
  };
  var close = function() {
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('visible');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', function() {
    sidebar.classList.contains('open') ? close() : open();
  });

  if (overlay) overlay.addEventListener('click', close);
}


// ── Listener de feedback des dels iframes ────────────────

window.addEventListener('message', function(e) {
  if (!e.data) return;
  var type   = e.data.type;
  var goalId = e.data.goalId;

  if (type === 'pycat-clear') {
    var fb = goalId ? document.querySelector('.simulador-feedback[data-goal-id="' + CSS.escape(goalId) + '"]') : null;
    if (fb) { fb.className = 'simulador-feedback'; fb.textContent = ''; }
    return;
  }

  if (type === 'pycat-result') {
    var success = e.data.success;
    var fb = goalId ? document.querySelector('.simulador-feedback[data-goal-id="' + CSS.escape(goalId) + '"]') : null;
    if (!fb) return;

    if (success) {
      fb.className = 'simulador-feedback fb-ok';
      var n = (e.data.results && e.data.results.length) || 0;
      fb.textContent = n > 1
        ? '✓ Correcte! Has passat els ' + n + ' tests.'
        : '✓ Correcte! El programa funciona bé.';

      // ── PROGRÉS: marca com a completat ──
      saveGoalCompleted(goalId);
      // Actualitza la sidebar per mostrar el ✓
      _refreshSidebar();

    } else {
      fb.className = 'simulador-feedback fb-ko';
      var results = e.data.results || [];
      var failed = null;
      for (var i = 0; i < results.length; i++) {
        if (!results[i].passed) { failed = results[i]; break; }
      }
      if (failed && failed.actual === null) {
        fb.textContent = '✗ El programa ha donat error. Revisa la consola.';
      } else if (failed) {
        var stdinInfo = failed.stdin
          ? ' amb input «' + failed.stdin.replace(/\n/g, ' | ') + '»'
          : '';
        fb.textContent = '✗ Test ' + (failed.testIdx + 1) + ' fallit' + stdinInfo +
          ': esperava «' + failed.expected + '», has tret «' + (failed.actual || '') + '».';
      } else {
        fb.textContent = '✗ La sortida no coincideix amb l\'esperada. Revisa el codi.';
      }
    }
  }
});

// Refresca la sidebar actual (detecta si estem en un capítol o repte)
function _refreshSidebar() {
  // Busca quin capítol/repte estem
  var path = window.location.pathname;
  var capMatch = path.match(/capitol-(\d+)\.html/);
  var repMatch = path.match(/repte-(\d+)\.html/);
  if (capMatch) renderSidebar(parseInt(capMatch[1], 10));
  else if (repMatch) renderReptesSidebar(parseInt(repMatch[1], 10));
}


// ── Glossari — injectat dinàmicament a capítols i reptes ──────────

function initGlossariCurs() {
  var header = document.querySelector('.curs-header');
  if (!header) return;

  // Botó a la capçalera
  var btn = document.createElement('button');
  btn.className = 'glossari-curs-btn';
  btn.id = 'btn-glossari-curs';
  btn.textContent = '📖 Glossari';
  btn.type = 'button';
  var actions = header.querySelector('.curs-header-actions');
  (actions || header).appendChild(btn);

  // Modal — contingut ve de glossari-data.js (variable GLOSSARI_HTML)
  var overlay = document.createElement('div');
  overlay.className = 'glossari-overlay';
  overlay.id = 'glossari-overlay';
  overlay.innerHTML = (typeof GLOSSARI_HTML !== 'undefined')
    ? GLOSSARI_HTML
    : '<div class="glossari-modal"><p>Glossari no disponible.</p></div>';
  document.body.appendChild(overlay);

  // Events
  btn.addEventListener('click', function() { overlay.classList.toggle('is-open'); });
  overlay.querySelector('#glossari-close').addEventListener('click', function() { overlay.classList.remove('is-open'); });
  overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.classList.remove('is-open'); });
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') overlay.classList.remove('is-open'); });
}

// Auto-init (capitols.js es carrega després del DOM)
initGlossariCurs();


// ── Exporta ──────────────────────────────────────────────
window.injectCursLogo      = injectCursLogo;
window.renderSidebar       = renderSidebar;
window.renderReptesSidebar = renderReptesSidebar;
window.renderSimuladors    = renderSimuladors;
window.initSidebarToggle   = initSidebarToggle;
window.initGlossariCurs    = initGlossariCurs;
window.getProgress         = getProgress;
window.saveGoalCompleted   = saveGoalCompleted;
window.isGoalCompleted     = isGoalCompleted;
