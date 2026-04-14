// ════════════════════════════════════════════════════════
// ui.js — Interfície: badge d'estat, botons, tema
//
// Patró idèntic a KarelCat: setStateUI muta el botó
// principal entre "Executa" i "Atura".
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

// ── Executa el programa ──────────────────────────────────
function runProgram() {
  P.consoleClear();
  P.clearLineMarks();

  const code = document.getElementById('code-editor')?.value || '';
  if (!code.trim()) {
    P.consolePush('⚠ Escriu codi abans d\'executar.', 'dim');
    return;
  }

  // Notifica al pare (iframe) que s'esborra el feedback anterior
  _notifyClear();

  P.pyRun(code, P.state._currentStdin || null, function(output) {
    // Callback quan l'execució acaba
    _validateAndNotify(output);
  });
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

// ── Validació (per a reptes) ─────────────────────────────
function _validateAndNotify(output) {
  if (!P.state.goalId) return;

  // Validació per stdout
  if (P.state.testCases && P.state.testCases.length > 0) {
    // Ja s'ha executat amb el primer test case; comparem
    const expected = P.state.testCases[P.state._currentTestIdx]?.expected ?? '';
    const success  = _normalizeOutput(output) === _normalizeOutput(expected);

    window.parent.postMessage({
      type: 'pycat-result',
      goalId: P.state.goalId,
      testIdx: P.state._currentTestIdx,
      success
    }, P.parentOrigin);
    return;
  }

  // Validació per test code
  if (P.state.testCode) {
    const success = output !== null; // si no hi ha error, els asserts han passat
    window.parent.postMessage({
      type: 'pycat-result',
      goalId: P.state.goalId,
      success
    }, P.parentOrigin);
  }
}

function _normalizeOutput(s) {
  if (!s) return '';
  return s.replace(/\r\n/g, '\n').trim();
}

function _notifyClear() {
  if (!P.state.goalId) return;
  window.parent.postMessage({
    type: 'pycat-clear', goalId: P.state.goalId
  }, P.parentOrigin);
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
P.setStateUI    = setStateUI;
P.handleRunClick = handleRunClick;
P.initTheme      = initTheme;
P.toggleTheme    = toggleTheme;
P.updateThemeBtn = updateThemeBtn;

window.handleRunClick = handleRunClick;
window.runProgram     = runProgram;
window.stopProgram    = stopProgram;
window.resetConsole   = resetConsole;
window.toggleTheme    = toggleTheme;
