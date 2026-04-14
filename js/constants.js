// ════════════════════════════════════════════════════════
// constants.js — Configuració central de PyCat
//
// Namespace global: P (com K per a KarelCat)
// Cada mòdul afegeix les seves funcions a P.*
// ════════════════════════════════════════════════════════

const P = {};

// ── Claus de localStorage ────────────────────────────────
P.LS_KEY_CODE    = 'pycat_code';
P.LS_KEY_THEME   = 'pycat-theme';
P.LS_KEY_PROGRESS = 'pycat_progress';

// ── Velocitats d'execució (no aplica directament, però
//    es manté per coherència amb Karel si es vol animació) ──
P.SPEED_DELAYS = [1200, 600, 300, 100, 30, 0];

// ── Codi per defecte al simulador lliure ─────────────────
P.DEFAULT_CODE = `# El teu primer programa Python
print("Hola, món!")
`;

// ── Timeout d'execució (ms) ──────────────────────────────
P.EXEC_TIMEOUT = 10000;   // 10 segons

// ── CDN de Pyodide ───────────────────────────────────────
P.PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';

// ── Internacionalització ─────────────────────────────────
// Estructura idèntica a KarelCat: UI_LANGS[codi].clau
P.UI_LANGS = {
  ca: {
    'ui.run':       '▶ Executa',
    'ui.stop':      '■ Atura',
    'ui.reset':     '↺ Neteja',
    'ui.speed':     'Velocitat:',
    'state.idle':   'llest',
    'state.loading':'carregant Python…',
    'state.running':'executant…',
    'state.done':   'finalitzat',
    'state.error':  'error',
    'log.running':  '⚡ Executant…',
    'log.done':     '✅ Programa completat',
    'log.error':    '❌ Error',
    'log.timeout':  '⏱ Temps excedit (possible bucle infinit)',
    'log.loading':  '🐍 Preparant Python…',
    'log.ready':    '🟢 Python llest',
    'log.reset':    '↺ Consola netejada',
    speed: ['Molt lent','Lent','Normal','Ràpid','Molt ràpid','Instant'],
  }
};

// ── Helpers HTML ─────────────────────────────────────────
P.escHtml = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

// ── Funció de traducció ──────────────────────────────────
P.t = function(key) {
  const lang = P.state?.uiLang || 'ca';
  return P.UI_LANGS[lang]?.[key] ?? key;
};
