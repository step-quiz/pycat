// ════════════════════════════════════════════════════════
// main.js — Inicialització: connecta els mòduls
//
// Paràmetres d'URL suportats:
//   ?embed=1         → amaga topbar (mode iframe)
//   ?code=BASE64     → codi inicial
//   ?readonly=1      → editor no editable
//   ?stdin=BASE64    → input predefinit per a input()
//                       · Si hi ha ?tests o ?expected, el stdin d'aquell param mana.
//                       · Si no, és un input lliure (simulador sense validació).
//   ?expected=BASE64 → output esperat (validació simple d'un sol cas)
//   ?tests=BASE64    → JSON de test cases: [{stdin, expected}, ...]
//   ?testcode=BASE64 → codi Python afegit al final del codi de l'alumne abans d'executar
//   ?goalId=ID       → identificador del repte (per postMessage)
//   ?theme=light     → força mode clar
// ════════════════════════════════════════════════════════

(function init() {
  const S      = P.state;
  const params = new URLSearchParams(location.search);

  // ── Decode base64 → UTF-8 ──
  function dec(b64) {
    try { return decodeURIComponent(escape(atob(b64))); } catch { return null; }
  }

  // ── Origen segur per a postMessage ──
  P.parentOrigin = (() => {
    try {
      return document.referrer
        ? new URL(document.referrer).origin
        : window.location.origin;
    } catch { return window.location.origin; }
  })();

  // 0) Tema
  P.initTheme();

  // 1) Editor
  P.initEditor();
  const ta = document.getElementById('code-editor');
  if (ta) {
    const useLS = !params.get('embed') && !params.get('code');
    const urlCode = params.get('code') ? dec(params.get('code')) : null;
    const saved = useLS ? localStorage.getItem(P.LS_KEY_CODE) : null;
    ta.value = urlCode || saved || P.DEFAULT_CODE;

    if (params.get('readonly') === '1') {
      ta.setAttribute('readonly', 'readonly');
      ta.style.cursor = 'default';
    }

    P.updateEditor();
    setTimeout(() => P.updateEditor(), 50);
  }

  // 2) Paràmetres de validació — estat normalitzat
  S.goalId    = params.get('goalId') || '';
  S.testCode  = params.get('testcode') ? (dec(params.get('testcode')) || '') : '';

  const urlStdin = params.get('stdin') ? dec(params.get('stdin')) : null;

  if (params.get('tests')) {
    // Múltiples test cases
    try {
      const parsed = JSON.parse(dec(params.get('tests')));
      // Normalitza: accepta tant {stdin, expected} com {input, expected} (legacy)
      S.testCases = parsed.map(tc => ({
        stdin:    tc.stdin !== undefined ? tc.stdin : (tc.input !== undefined ? tc.input : null),
        expected: tc.expected !== undefined ? tc.expected : ''
      }));
    } catch(_) {
      S.testCases = null;
    }
    S.freeStdin = null;
  } else if (params.get('expected')) {
    // Un sol test case amb expected (i possiblement un stdin associat)
    S.testCases = [{
      stdin:    urlStdin,
      expected: dec(params.get('expected')) || ''
    }];
    S.freeStdin = null;
  } else {
    // Sense validació — simulador lliure, potser amb stdin predefinit
    S.testCases = null;
    S.freeStdin = urlStdin;
  }

  // 3) Inicialitza Pyodide (pre-carrega al worker)
  P.pyInit();

  // 4) Estat inicial de la UI
  P.setStateUI('loading');

})();
