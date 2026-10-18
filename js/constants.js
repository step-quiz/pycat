// ════════════════════════════════════════════════════════
// constants.js — Configuració central de PyCat
//
// Tots els fitxers de js/ (menys pyworker.js, que és el Web Worker, i
// kbd-accessory.js i sw-register.js, que són scripts clàssics) són mòduls ES:
// cadascun exporta el que fan servir els altres i importa el que necessita.
// L'entrada és main.js (<script type="module"> a index.html).
// ════════════════════════════════════════════════════════


// ── Claus de localStorage ────────────────────────────────
export const LS_KEY_CODE     = 'pycat_code';
export const LS_KEY_THEME    = 'pycat-theme';
// (El progrés del curs es desa a 'pycat_progress' des de curs/capitols.js.)

// ── Codi per defecte al simulador lliure ─────────────────
export const DEFAULT_CODE = `# El teu primer programa Python
print("Hola, món!")
`;

// ── Timeout d'execució (ms) ──────────────────────────────
export const EXEC_TIMEOUT = 10000;   // 10 segons

// ── CDN de Pyodide ───────────────────────────────────────
export const PYODIDE_CDN = 'https://cdn.jsdelivr.net/pyodide/v0.27.7/full/';
export const PYODIDE_CDN_FALLBACK = 'https://pyodide-cdn2.iodide.io/v0.27.7/full/';

// ── Helpers HTML ─────────────────────────────────────────
export const escHtml = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
