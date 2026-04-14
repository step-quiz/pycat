// ════════════════════════════════════════════════════════
// ui.js — Interfície: badge d'estat, botons, tema, validació
//
// Patró idèntic a KarelCat: setStateUI muta el botó
// principal entre "Executa" i "Atura".
//
// Flux de validació:
//   1. runProgram() construeix finalCode = userCode + testCode
//   2. Si hi ha testCases, executa el finalCode un cop per cada test case
//      (seqüencialment) amb el seu stdin, i compara amb expected.
//   3. Si no, fa una execució lliure (amb freeStdin si n'hi ha).
//   4. Un cop acaba tot, notifica el pare amb {success, results}.
// ════════════════════════════════════════════════════════

// ── Badge d'estat + mutació del botó ─────────────────────

function setStateUI(state) {
  P.state.currentState = state;
  const dot = document.getElementById('state-dot');
  const lbl = document.getElementById('state-lbl');
  if (dot) dot.className = state;
  if (lbl) lbl.textContent = P.t('state.' + state);

  const btn = document.getElementById('btn-run');
  if (btn) {
    const active = (state === 'running' || state === 'loading');
    btn.textContent = P.t(active ? 'ui.stop' : 'ui.run');
    btn.classList.toggle('p', !active);
    btn.classList.toggle('r', active);
  }
}

// ── Handler del botó principal ───────────────────────────
function handleRunClick() {
  const s = P.state.currentState;
  if (s === 'running') {
    stopProgram();
  } else {
    runProgram();
  }
}

// ── Construeix el codi final (codi de l'alumne + testCode) ──
function _buildFinalCode(userCode) {
  const tc = P.state.testCode || '';
  if (!tc) return userCode;
  return userCode + '\n\n# ── Tests ──\n' + tc;
}

// ── Executa el programa ──────────────────────────────────
async function runProgram() {
  P.consoleClear();
  P.clearLineMarks();

  const userCode = document.getElementById('code-editor')?.value || '';
  if (!userCode.trim()) {
    P.consolePush('⚠ Escriu codi abans d\'executar.', 'dim');
    return;
  }

  _notifyClear();

  const S = P.state;
  const finalCode = _buildFinalCode(userCode);

  // ── Cas 1: sense validació (simulador lliure) ──
  if (!S.testCases) {
    await P.pyRunAsync(finalCode, S.freeStdin || null);
    return;
  }

  // ── Cas 2: amb validació — itera pels test cases ──
  const results = [];
  for (let i = 0; i < S.testCases.length; i++) {
    const tc = S.testCases[i];

    // Divider visual entre tests (només si n'hi ha més d'un)
    if (S.testCases.length > 1) {
      P.consolePush(`── Test ${i + 1}/${S.testCases.length} ──`, 'dim');
    }

    const output = await P.pyRunAsync(finalCode, tc.stdin || null);

    const passed = output !== null &&
                   _normalizeOutput(output) === _normalizeOutput(tc.expected || '');

    results.push({
      testIdx:  i,
      stdin:    tc.stdin || '',
      expected: tc.expected || '',
      actual:   output,
      passed:   passed
    });

    // Si hi ha un error d'execució, no té sentit continuar amb la resta
    // (el codi de l'alumne peta de la mateixa manera amb qualsevol input).
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
  const allPassed = results.length > 0 && results.every(r => r.passed);
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
const ICON_SUN  = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>`;
const ICON_MOON = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>`;

function updateThemeBtn() {
  const btn = document.getElementById('btn-theme');
  if (!btn) return;
  const isLight = document.body.classList.contains('light');
  btn.innerHTML = isLight ? ICON_MOON : ICON_SUN;
  btn.title     = isLight ? 'Mode fosc' : 'Mode clar';
}

function toggleTheme() {
  const isLight = document.body.classList.toggle('light');
  localStorage.setItem(P.LS_KEY_THEME, isLight ? 'light' : 'dark');
  updateThemeBtn();
}

function initTheme() {
  const saved = localStorage.getItem(P.LS_KEY_THEME);
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
