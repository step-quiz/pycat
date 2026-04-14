// ════════════════════════════════════════════════════════
// pyrunner.js — Gestió del Web Worker de Pyodide
//
// Responsabilitats:
//   1. Crear i gestionar el Worker (spawn, kill, re-spawn)
//   2. Carregar Pyodide (una sola vegada, amb callback de progrés)
//   3. Executar codi i recopilar stdout/stderr
//   4. Gestionar timeout (bucles infinits → terminate)
//   5. Exposar l'output per a la validació
//
// Patró: el Worker és un recurs que es pot matar i tornar
//        a crear. Això és la clau per aturar bucles infinits.
// ════════════════════════════════════════════════════════

// ── Spawna el worker ─────────────────────────────────────
function _spawnWorker() {
  const S = P.state;
  if (S.worker) return;

  S.worker = new Worker('js/pyworker.js');
  S.pyodideReady = false;

  S.worker.onmessage = function(e) {
    const { type } = e.data;
    if (_handlers[type]) _handlers[type](e.data);
  };

  S.worker.onerror = function(e) {
    P.consolePush('Error intern del worker: ' + e.message, 'err');
    P.setStateUI('error');
  };
}

// ── Handlers de missatges del worker ─────────────────────
// S'actualitzen dinàmicament quan comença una execució.
const _handlers = {
  ready: function() {
    P.state.pyodideReady = true;
    P.consolePush(P.t('log.ready'), 'ok');
    P.setStateUI('idle');
  },
  stdout: function(d) {
    P.consolePush(d.text, 'out');
    _currentOutput.push(d.text);
  },
  stderr: function(d) {
    P.consolePush(d.text, 'err');
  },
  done: function(d) {
    _clearTimeout();
    P.state.running = false;
    P.consolePush(`${P.t('log.done')} (${d.elapsed}ms)`, 'ok');
    P.setStateUI('done');
    // Usa d.output (raw Python stdout) per a la validació — és la font de veritat
    if (_onDone) _onDone(d.output ?? _currentOutput.join('\n'));
  },
  error: function(d) {
    _clearTimeout();
    P.state.running = false;
    P.consolePush(`${P.t('log.error')}: ${d.msg}`, 'err');
    if (d.line) P.markErrorLine(d.line);
    P.setStateUI('error');
    if (_onDone) _onDone(null);
  },
};

// ── Estat d'una execució en curs ─────────────────────────
let _currentOutput = [];
let _timeoutId     = null;
let _onDone        = null;

function _clearTimeout() {
  if (_timeoutId) { clearTimeout(_timeoutId); _timeoutId = null; }
}

// ── API pública ──────────────────────────────────────────

// Inicialitza Pyodide (carrega el runtime al worker)
function pyInit() {
  _spawnWorker();
  P.setStateUI('loading');
  P.consolePush(P.t('log.loading'), 'dim');
  P.state.worker.postMessage({ type: 'init', cdnUrl: P.PYODIDE_CDN });
}

// Executa codi Python.
// onDone(output): callback amb el text complet de stdout (o null si error)
function pyRun(code, stdin, onDone) {
  const S = P.state;

  // Inicialitza Pyodide si encara no s'ha fet
  if (!S.worker) {
    _spawnWorker();
    // Quan estigui llest, re-intentem
    const origReady = _handlers.ready;
    _handlers.ready = function() {
      origReady();
      _handlers.ready = origReady;  // restaura
      pyRun(code, stdin, onDone);      // re-intenta
    };
    P.setStateUI('loading');
    P.consolePush(P.t('log.loading'), 'dim');
    S.worker.postMessage({ type: 'init', cdnUrl: P.PYODIDE_CDN });
    return;
  }

  if (!S.pyodideReady) {
    P.consolePush('⏳ Esperant que Python estigui llest…', 'dim');
    return;
  }

  // Reset
  _currentOutput = [];
  _onDone = onDone || null;
  S.running = true;
  S.startTime = Date.now();

  P.clearLineMarks();
  P.setStateUI('running');
  P.consolePush(P.t('log.running'), 'dim');

  // Timeout de seguretat
  _timeoutId = setTimeout(function() {
    pyKill();
    P.consolePush(P.t('log.timeout'), 'err');
    P.setStateUI('error');
    if (_onDone) _onDone(null);
  }, P.EXEC_TIMEOUT);

  // Envia al worker
  S.worker.postMessage({ type: 'run', code, stdin });
}

// Mata el worker (atura qualsevol execució)
function pyKill() {
  const S = P.state;
  _clearTimeout();
  if (S.worker) {
    S.worker.terminate();
    S.worker = null;
  }
  S.running = false;
  S.pyodideReady = false;
}

// Atura i re-spawna (per a poder executar de nou)
function pyStop() {
  pyKill();
  // Re-spawna i re-inicialitza per a la propera execució
  _spawnWorker();
  P.setStateUI('loading');
  P.consolePush('🔄 Re-inicialitzant Python…', 'dim');
  P.state.worker.postMessage({ type: 'init', cdnUrl: P.PYODIDE_CDN });
}


// ── Exporta al namespace P ───────────────────────────────
P.pyInit = pyInit;
P.pyRun  = pyRun;
P.pyKill = pyKill;
P.pyStop = pyStop;
