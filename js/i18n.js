// ════════════════════════════════════════════════════════
// i18n.js — Internacionalització de la interfície PyCat
//
// Conté:
//   P.UI_LANGS   — Diccionari de traduccions per idioma
//   P.t(key)     — Retorna la traducció de la clau per l'idioma actiu
//   P.setLang(code) — Canvia l'idioma de la UI i actualitza els elements
//   P.initLangSelector() — Crea el selector d'idioma a la topbar
//
// Idiomes: ca (català, per defecte), es (castellà), en (anglès)
// Les pàgines del curs (curs/*.html) NO es veuen afectades —
// el seu contingut és sempre en català.
// ════════════════════════════════════════════════════════

P.LS_KEY_LANG = 'pycat_lang';

// ── Traduccions ─────────────────────────────────────────
P.UI_LANGS = {
  ca: {
    'ui.run':               '▶ Executa',
    'ui.stop':              '■ Atura',
    'ui.reset':             '↺ Neteja',
    'state.idle':           'llest',
    'state.loading':        'carregant Python…',
    'state.running':        'executant…',
    'state.done':           'finalitzat',
    'state.error':          'error',
    'log.running':          '⚡ Executant…',
    'log.done':             '✅ Programa completat',
    'log.error':            '❌ Error',
    'log.timeout':          '⏱ Temps excedit (possible bucle infinit)',
    'log.loading':          'Preparant Python…',
    'log.ready':            '🟢 Python llest',
    'log.reset':            '↺ Consola netejada',
    'log.stdin':            '📥 Entrades del programa',
    'log.stdin.hint':       '(una per línia — es passen a input())',
    'log.input.placeholder':'Escriu aquí i prem Enter…',
    'log.waiting':          '⏳ Esperant entrada…',
    'log.load_error':       '❌ No s\'ha pogut carregar Python. Comprova la connexió a internet i recarrega la pàgina.',
    'log.load_retry':       '🔄 Tornant a provar amb un servidor alternatiu…',
    'ui.retry':             '🔄 Torna a provar',
    'ui.validate':          '▶ Valida',
    'ui.readonly':          'No editable',
    'log.ran_interactive':  '✔ Programa executat. Prem ▶ Valida per comprovar.',
    'log.validating':       '── Validació ──',
  },

  es: {
    'ui.run':               '▶ Ejecutar',
    'ui.stop':              '■ Parar',
    'ui.reset':             '↺ Limpiar',
    'state.idle':           'listo',
    'state.loading':        'cargando Python…',
    'state.running':        'ejecutando…',
    'state.done':           'finalizado',
    'state.error':          'error',
    'log.running':          '⚡ Ejecutando…',
    'log.done':             '✅ Programa completado',
    'log.error':            '❌ Error',
    'log.timeout':          '⏱ Tiempo excedido (posible bucle infinito)',
    'log.loading':          'Preparando Python…',
    'log.ready':            '🟢 Python listo',
    'log.reset':            '↺ Consola limpia',
    'log.stdin':            '📥 Entradas del programa',
    'log.stdin.hint':       '(una por línea — se pasan a input())',
    'log.input.placeholder':'Escribe aquí y pulsa Enter…',
    'log.waiting':          '⏳ Esperando entrada…',
    'log.load_error':       '❌ No se ha podido cargar Python. Comprueba la conexión a internet y recarga la página.',
    'log.load_retry':       '🔄 Reintentando con un servidor alternativo…',
    'ui.retry':             '🔄 Reintentar',
    'ui.validate':          '▶ Validar',
    'ui.readonly':          'No editable',
    'log.ran_interactive':  '✔ Programa ejecutado. Pulsa ▶ Validar para comprobar.',
    'log.validating':       '── Validación ──',
  },

  en: {
    'ui.run':               '▶ Run',
    'ui.stop':              '■ Stop',
    'ui.reset':             '↺ Clear',
    'state.idle':           'ready',
    'state.loading':        'loading Python…',
    'state.running':        'running…',
    'state.done':           'done',
    'state.error':          'error',
    'log.running':          '⚡ Running…',
    'log.done':             '✅ Program completed',
    'log.error':            '❌ Error',
    'log.timeout':          '⏱ Time limit exceeded (possible infinite loop)',
    'log.loading':          '🐍 Loading Python…',
    'log.ready':            '🟢 Python ready',
    'log.reset':            '↺ Console cleared',
    'log.stdin':            '📥 Program input',
    'log.stdin.hint':       '(one per line — passed to input())',
    'log.input.placeholder':'Type here and press Enter…',
    'log.waiting':          '⏳ Waiting for input…',
    'log.load_error':       '❌ Could not load Python. Check your internet connection and reload the page.',
    'log.load_retry':       '🔄 Retrying with an alternative server…',
    'ui.retry':             '🔄 Retry',
    'ui.validate':          '▶ Validate',
    'ui.readonly':          'Read-only',
    'log.ran_interactive':  '✔ Program ran. Press ▶ Validate to check.',
    'log.validating':       '── Validation ──',
  }
};

// ── Funció de traducció ──────────────────────────────────
P.t = function(key) {
  var lang = P.state ? P.state.uiLang : 'ca';
  var dict = P.UI_LANGS[lang] || P.UI_LANGS.ca;
  return dict[key] !== undefined ? dict[key] : (P.UI_LANGS.ca[key] !== undefined ? P.UI_LANGS.ca[key] : key);
};

// ── Canvia l'idioma i actualitza la UI ───────────────────
P.setLang = function(code) {
  if (!P.UI_LANGS[code]) return;
  if (P.state) P.state.uiLang = code;
  try { localStorage.setItem(P.LS_KEY_LANG, code); } catch(_) {}

  // Actualitza elements de la UI que mostren text traduïble
  _refreshUI();
};

// ── Actualitza textos de la UI amb l'idioma actual ───────
function _refreshUI() {
  // Botó Run/Stop
  var btnRun = document.getElementById('btn-run');
  if (btnRun) {
    var running = P.state && P.state.currentState === 'running';
    btnRun.textContent = P.t(running ? 'ui.stop' : 'ui.run');
  }

  // Botó Reset
  var btnReset = document.getElementById('btn-reset');
  if (btnReset) btnReset.textContent = P.t('ui.reset');

  // Badge d'estat
  var stateLbl = document.getElementById('state-lbl');
  if (stateLbl && P.state) {
    stateLbl.textContent = P.t('state.' + P.state.currentState);
  }

  // Selector d'idioma — marca l'actiu
  var sel = document.getElementById('lang-select');
  if (sel && P.state) sel.value = P.state.uiLang;
}

// ── Inicialitza el selector d'idioma ─────────────────────
P.initLangSelector = function() {
  var actions = document.querySelector('.topbar-actions');
  if (!actions) return;

  var sel = document.createElement('select');
  sel.id = 'lang-select';
  sel.className = 'lang-select';
  sel.setAttribute('aria-label', 'Idioma de la interfície');

  var langs = [
    { code: 'ca', label: 'CA' },
    { code: 'es', label: 'ES' },
    { code: 'en', label: 'EN' }
  ];

  langs.forEach(function(l) {
    var opt = document.createElement('option');
    opt.value = l.code;
    opt.textContent = l.label;
    sel.appendChild(opt);
  });

  // Carrega preferència guardada
  var saved = null;
  try { saved = localStorage.getItem(P.LS_KEY_LANG); } catch(_) {}
  if (saved && P.UI_LANGS[saved]) {
    sel.value = saved;
    if (P.state) P.state.uiLang = saved;
  } else {
    sel.value = (P.state && P.state.uiLang) || 'ca';
  }

  sel.addEventListener('change', function() {
    P.setLang(sel.value);
  });

  // Insereix el selector abans del botó de tema
  var themeBtn = document.getElementById('btn-theme');
  if (themeBtn) {
    themeBtn.parentNode.insertBefore(sel, themeBtn);
  } else {
    actions.appendChild(sel);
  }
};
