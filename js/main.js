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
//   ?requires=a,b    → construccions que el codi ha de fer servir (js/pycat_requires.py)
//   ?save=CLAU       → desa el codi de l'alumne a localStorage[CLAU] i mostra «⟲ Codi inicial»
//   ?interactive=1   → exercici amb input(): primer s'executa en mode interactiu i
//                       després el botó passa a «▶ Valida» (cal SharedArrayBuffer)
//   ?theme=light     → força mode clar
// ════════════════════════════════════════════════════════

import { consolePush, consoleShowStdinPanel } from './console.js';
import { DEFAULT_CODE, LS_KEY_CODE } from './constants.js';
import { editText, initEditor, updateEditor } from './editor.js';
import { t } from './i18n.js';
import { canInteractive, pyInit, whenReady } from './pyrunner.js';
import { state } from './state.js';
import { initStepper } from './stepper.js';
import { initFileActions, initGlossari, initTheme, setStateUI } from './ui.js';

(function init() {
  const S      = state;
  const params = new URLSearchParams(location.search);

  // ── Decode base64 → UTF-8 ──
  function dec(b64) {
    try { return decodeURIComponent(escape(atob(b64))); } catch { return null; }
  }

  // ── Origen segur per a postMessage ──
  state.parentOrigin = (() => {
    try {
      return document.referrer
        ? new URL(document.referrer).origin
        : window.location.origin;
    } catch { return window.location.origin; }
  })();

  // 0) Tema
  initTheme();

  // 0b) Glossari
  initGlossari();

  // 0c) Obrir / Desar fitxers
  initFileActions();

  // 0d) «👣 Pas a pas»
  initStepper();

  // 1) Editor
  initEditor();
  const ta       = document.getElementById('code-editor');
  const embed    = params.get('embed') === '1';
  const readonly = params.get('readonly') === '1';
  const urlCode  = params.has('code') ? dec(params.get('code')) : null;

  // ── On es desa el codi de l'alumne ──
  //   · simulador lliure (sense codi a la URL): la clau de sempre
  //   · exercici del curs (?save=CLAU): una clau pròpia per a cada exercici
  //   · exemples no editables o enllaços amb codi: no es desa
  const saveKey = params.get('save');
  if (!embed && urlCode === null)  state.codeStorageKey = LS_KEY_CODE;
  else if (saveKey && !readonly)   state.codeStorageKey = saveKey;
  else                             state.codeStorageKey = null;
  state.initialCode = urlCode !== null ? urlCode : DEFAULT_CODE;

  if (ta) {
    let saved = null;
    if (state.codeStorageKey) {
      try { saved = localStorage.getItem(state.codeStorageKey); } catch(_) {}
    }
    ta.value = saved !== null ? saved : state.initialCode;

    if (readonly) {
      ta.setAttribute('readonly', 'readonly');
      ta.style.cursor = 'default';
      document.body.classList.add('is-readonly');

      // Toast "No editable" en clicar l'editor readonly
      var toast = document.createElement('div');
      toast.className = 'readonly-toast';
      toast.textContent = t('ui.readonly');
      document.querySelector('.editor-inner').appendChild(toast);

      var hideTimer = null;
      ta.addEventListener('pointerdown', function() {
        clearTimeout(hideTimer);
        toast.classList.add('visible');
        hideTimer = setTimeout(function() { toast.classList.remove('visible'); }, 1400);
      });
    }

    updateEditor();
    setTimeout(() => updateEditor(), 50);
  }

  // 1b) Botons extra de la barra d'eines (només als exercicis del curs)
  const spacer = document.querySelector('.toolbar .toolbar-spacer');
  function addToolbarButton(id, text, title, onClick) {
    const b = document.createElement('button');
    b.className = 'btn';
    b.id = id;
    b.type = 'button';
    b.textContent = text;
    b.title = title;
    b.addEventListener('click', onClick);
    if (spacer) spacer.parentNode.insertBefore(b, spacer);
    return b;
  }

  // «⟲ Codi inicial»: torna a l'esquelet original de l'exercici
  if (ta && state.codeStorageKey && state.codeStorageKey !== LS_KEY_CODE) {
    addToolbarButton('btn-restore-code', t('ui.restore'), t('ui.restore_title'), function() {
      if (ta.value === state.initialCode) return;
      if (!confirm(t('ui.restore_confirm'))) return;
      editText(ta, state.initialCode, 0, ta.value.length);   // Ctrl+Z ho desfà
      ta.setSelectionRange(0, 0);
      ta.scrollTop = 0;
      consolePush(t('log.code_restored'), 'dim');
    });
  }

  // «✕ Surt»: visible quan la pàgina del curs posa aquest simulador a
  // pantalla completa (ho avisa amb un missatge 'pycat-fs').
  if (embed && window.parent !== window) {
    const exitBtn = addToolbarButton('btn-exit-fs', t('ui.exit_fs'), t('ui.exit_fs_title'), function() {
      try { window.parent.postMessage({ type: 'pycat-exit-fs' }, state.parentOrigin); } catch(_) {}
    });
    exitBtn.hidden = true;
    window.addEventListener('message', function(e) {
      if (e.source !== window.parent || !e.data || e.data.type !== 'pycat-fs') return;
      exitBtn.hidden = !e.data.on;
    });
  }

  // 2) Paràmetres de validació — estat normalitzat
  S.goalId    = params.get('goalId') || '';
  S.requires  = params.get('requires') || '';
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

  // 3) Python (Pyodide)
  //    · Simulador lliure: es pre-carrega de seguida (només n'hi ha un).
  //    · Simuladors incrustats al curs: es carrega en el PRIMER clic a
  //      ▶ Executa (pyRun ho fa sol). Una pàgina amb 20 simuladors ja no
  //      carrega 20 intèrprets de Python quan l'alumne fa scroll.
  S.wantsInteractive = params.get('interactive') === '1';

  if (embed) {
    setStateUI('idle');
    consolePush(t('log.lazy'), 'dim');
  } else {
    pyInit();
    setStateUI('loading');
  }

  // 5) Mostra el panell stdin si estem en mode lliure sense SAB
  //    i el codi per defecte (o el carregat) conté input()
  if (!S.testCases && !S.freeStdin && !canInteractive()) {
    var code = ta ? ta.value : '';
    if (/\binput\s*\(/.test(code)) {
      // Simulador lliure: es mostra quan Python és llest (per no tapar el
      // missatge de càrrega). Incrustat (càrrega sota demanda): de seguida.
      if (embed) consoleShowStdinPanel();
      else whenReady(consoleShowStdinPanel);
    }
  }

})();
