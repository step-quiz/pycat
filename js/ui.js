// ════════════════════════════════════════════════════════
// ui.js — Interfície: badge d'estat, botons, tema, validació
//
// Flux de validació:
//   1. runProgram() construeix finalCode = userCode + testCode
//   2. Si hi ha testCases, executa el finalCode un cop per cada test case
//      (seqüencialment) amb el seu stdin, i compara amb expected.
//   3. Si no, fa una execució lliure (amb freeStdin si n'hi ha,
//      o amb mode interactiu / stdin panel).
//   4. Un cop acaba tot, notifica el pare amb {success, results}.
// ════════════════════════════════════════════════════════

// ── Badge d'estat + mutació del botó ─────────────────────

function setStateUI(state) {
  P.state.currentState = state;
  var dot = document.getElementById('state-dot');
  var lbl = document.getElementById('state-lbl');
  if (dot) dot.className = state;
  if (lbl) lbl.textContent = P.t('state.' + state);

  var btn = document.getElementById('btn-run');
  if (btn) {
    var active = (state === 'running' || state === 'loading');
    btn.textContent = P.t(active ? 'ui.stop' : 'ui.run');
    btn.classList.toggle('p', !active);
    btn.classList.toggle('r', active);
  }
}

// ── Handler del botó principal ───────────────────────────
function handleRunClick() {
  var s = P.state.currentState;
  if (s === 'running') {
    stopProgram();
  } else {
    runProgram();
  }
}

// ── Construeix el codi final (codi de l'alumne + testCode) ──
function _buildFinalCode(userCode) {
  var tc = P.state.testCode || '';
  if (!tc) return userCode;
  return userCode + '\n\n# ── Tests ──\n' + tc;
}

// ── Detecta si el codi conté input() ─────────────────────
function _usesInput(code) {
  // Busca input( ignorant dins de comentaris i strings (simplificat)
  var lines = code.split('\n');
  for (var i = 0; i < lines.length; i++) {
    var line = lines[i];
    // Ignora la part de comentari
    var hashIdx = -1;
    var inStr = false, strChar = '';
    for (var j = 0; j < line.length; j++) {
      var c = line[j];
      if (inStr) {
        if (c === '\\') { j++; continue; }
        if (c === strChar) inStr = false;
      } else {
        if (c === '"' || c === "'") { inStr = true; strChar = c; }
        else if (c === '#') { hashIdx = j; break; }
      }
    }
    var effective = hashIdx >= 0 ? line.substring(0, hashIdx) : line;
    if (/\binput\s*\(/.test(effective)) return true;
  }
  return false;
}

// ── Gestió del panell stdin (fallback) ───────────────────
function _ensureStdinPanel(code) {
  // Mostra el panell stdin si el codi usa input() i estem en mode lliure
  // sense stdin predefinit, sense SAB, i sense tests
  var S = P.state;
  if (!S.testCases && !S.freeStdin && !P.canInteractive() && _usesInput(code)) {
    P.consoleShowStdinPanel();
  }
}

// ── Executa el programa ──────────────────────────────────
async function runProgram() {
  P.consoleClear();
  P.clearLineMarks();

  var userCode = (document.getElementById('code-editor') || {}).value || '';
  if (!userCode.trim()) {
    P.consolePush('⚠ Escriu codi abans d\'executar.', 'dim');
    return;
  }

  _notifyClear();

  var S = P.state;
  var finalCode = _buildFinalCode(userCode);

  // ── Cas 1: sense validació (simulador lliure) ──
  if (!S.testCases) {
    var stdin = S.freeStdin || null;

    // Mode interactiu: si SAB disponible i el codi usa input()
    if (!stdin && P.canInteractive() && _usesInput(userCode)) {
      P.consoleHideStdinPanel();
      await P.pyRunAsync(finalCode, null, true);  // interactive=true
      return;
    }

    // Fallback: recull stdin del panell textarea si n'hi ha
    if (!stdin) {
      var panelStdin = P.consoleGetStdin();
      if (panelStdin) {
        stdin = panelStdin;
      }
    }

    P.consoleHideStdinPanel();
    await P.pyRunAsync(finalCode, stdin);
    // Mostra el panell per la propera execució si cal
    _ensureStdinPanel(userCode);
    return;
  }

  // ── Cas 2: amb validació — itera pels test cases ──
  var results = [];
  for (var i = 0; i < S.testCases.length; i++) {
    var tc = S.testCases[i];

    if (S.testCases.length > 1) {
      P.consolePush('── Test ' + (i + 1) + '/' + S.testCases.length + ' ──', 'dim');
    }

    var output = await P.pyRunAsync(finalCode, tc.stdin || null);

    var passed = output !== null &&
                 _normalizeOutput(output) === _normalizeOutput(tc.expected || '');

    results.push({
      testIdx:  i,
      stdin:    tc.stdin || '',
      expected: tc.expected || '',
      actual:   output,
      passed:   passed
    });

    if (output === null) break;
  }

  _notifyResults(results);
}

// ── Atura el programa ────────────────────────────────────
function stopProgram() {
  P.pyStop();
}

// ── Neteja la consola ────────────────────────────────────
function resetConsole() {
  P.consoleClear();
  P.clearLineMarks();
  P.setStateUI('idle');
  P.consolePush(P.t('log.reset'), 'dim');
  _notifyClear();
  // Mostra el panell stdin si cal
  var code = (document.getElementById('code-editor') || {}).value || '';
  _ensureStdinPanel(code);
}

// ── Normalització d'output per a comparació ──────────────
function _normalizeOutput(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/\r\n/g, '\n').trim();
}

// ── Notificacions al pare (iframe) ───────────────────────
function _notifyClear() {
  if (!P.state.goalId) return;
  try {
    window.parent.postMessage({
      type: 'pycat-clear', goalId: P.state.goalId
    }, P.parentOrigin);
  } catch(_) {}
}

function _notifyResults(results) {
  if (!P.state.goalId) return;
  var allPassed = results.length > 0 && results.every(function(r) { return r.passed; });
  try {
    window.parent.postMessage({
      type:    'pycat-result',
      goalId:  P.state.goalId,
      success: allPassed,
      results: results
    }, P.parentOrigin);
  } catch(_) {}
}

// ── Tema clar/fosc ───────────────────────────────────────
var ICON_SUN  = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
var ICON_MOON = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';

function updateThemeBtn() {
  var btn = document.getElementById('btn-theme');
  if (!btn) return;
  var isLight = document.body.classList.contains('light');
  btn.innerHTML = isLight ? ICON_MOON : ICON_SUN;
  btn.title     = isLight ? 'Mode fosc' : 'Mode clar';
}

function toggleTheme() {
  var isLight = document.body.classList.toggle('light');
  localStorage.setItem(P.LS_KEY_THEME, isLight ? 'light' : 'dark');
  updateThemeBtn();
}

function initTheme() {
  var saved = localStorage.getItem(P.LS_KEY_THEME);
  if (saved !== 'dark') document.body.classList.add('light');
  updateThemeBtn();
}


// ── Exporta ──────────────────────────────────────────────
P.setStateUI     = setStateUI;
P.handleRunClick = handleRunClick;
P.initTheme      = initTheme;
P.toggleTheme    = toggleTheme;
P.updateThemeBtn = updateThemeBtn;

window.handleRunClick = handleRunClick;
window.runProgram     = runProgram;
window.stopProgram    = stopProgram;
window.resetConsole   = resetConsole;
window.toggleTheme    = toggleTheme;
