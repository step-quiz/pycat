// ════════════════════════════════════════════════════════
// main.js — Inicialització: connecta els mòduls
//
// Paràmetres d'URL suportats (idèntics en esperit a KarelCat):
//   ?embed=1         → amaga topbar (mode iframe)
//   ?code=BASE64     → codi inicial
//   ?readonly=1      → editor no editable
//   ?stdin=BASE64    → input predefinit per a input()
//   ?expected=BASE64 → output esperat (validació simple)
//   ?tests=BASE64    → JSON de test cases
//   ?testcode=BASE64 → codi de test unitari
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

  // 2) Paràmetres de validació
  S.goalId    = params.get('goalId') || '';
  S._currentStdin = params.get('stdin') ? dec(params.get('stdin')) : null;
  S._currentTestIdx = 0;

  if (params.get('expected')) {
    S.testCases = [{ input: S._currentStdin || '', expected: dec(params.get('expected')) }];
  } else if (params.get('tests')) {
    try { S.testCases = JSON.parse(dec(params.get('tests'))); } catch(_) {}
  }

  if (params.get('testcode')) {
    S.testCode = dec(params.get('testcode'));
  }

  // 3) Inicialitza Pyodide (pre-carrega al worker)
  P.pyInit();

  // 4) Estat inicial de la UI
  P.setStateUI('loading');

})();
