// ════════════════════════════════════════════════════════
// pyrunner.js — Gestió del Web Worker de Pyodide
//
// Responsabilitats:
//   1. Crear i gestionar el Worker (spawn, kill, re-spawn)
//   2. Carregar Pyodide (una sola vegada, amb callback de progrés)
//   3. Executar codi i recopilar stdout/stderr
//   4. Gestionar timeout (bucles infinits → terminate)
//   5. Exposar l'output per a la validació
//   6. Mode interactiu: gestionar input() via SharedArrayBuffer
//
// API pública:
//   pyInit()                          — carrega Pyodide al worker
//   pyRun(code, stdin, onDone)        — executa i crida callback(output|null)
//   pyRunAsync(code, stdin)           — executa i retorna Promise<output|null>
//   pyCheck(code, requires)           — Promise<requisits que falten> (data-requires)
//   pyTrace(code, stdin, userLines)   — Promise<execució pas a pas> (pycat_trace.py)
//   whenReady(fn)                     — crida fn quan Python estigui llest
//   pyKill()                          — mata el worker
//   pyStop()                          — mata i re-spawna
//   canInteractive()                  — true si SharedArrayBuffer disponible
// ════════════════════════════════════════════════════════

import { consoleClear, consoleHideInput, consolePush, consolePushPartial, consoleShowInput } from './console.js';
import { EXEC_TIMEOUT, PYODIDE_CDN, PYODIDE_CDN_FALLBACK } from './constants.js';
import { clearLineMarks, markErrorLine } from './editor.js';
import { explainError } from './errors.js';
import { t as tr } from './i18n.js';
import { state } from './state.js';
import { turtleShow } from './turtle-view.js';
import { setStateUI } from './ui.js';

// ── Capacitat interactiva ────────────────────────────────
var _canInteractive = (typeof SharedArrayBuffer !== 'undefined');

function canInteractive() {
  return _canInteractive;
}

// ── SharedArrayBuffer per input interactiu ───────────────
// Layout: Int32[0]=estat, Int32[1]=longitud, bytes 8..4104=dades UTF-8
var _inputSAB     = null;
var _inputControl = null;
var INPUT_BUF_SIZE = 4104;  // 8 bytes control + 4096 bytes dades

function _ensureInputBuffer() {
  if (!_inputSAB && _canInteractive) {
    try {
      _inputSAB = new SharedArrayBuffer(INPUT_BUF_SIZE);
      _inputControl = new Int32Array(_inputSAB);
    } catch (e) {
      _canInteractive = false;
      _inputSAB = null;
      _inputControl = null;
    }
  }
}

// ── Spawna el worker ─────────────────────────────────────
function _spawnWorker() {
  var S = state;
  if (S.worker) return;

  S.worker = new Worker('js/pyworker.js');
  S.pyodideReady = false;

  S.worker.onmessage = function(e) {
    var type = e.data.type;
    if (_handlers[type]) _handlers[type](e.data);
  };

  S.worker.onerror = function(e) {
    consolePush(tr('log.worker_error') + ' ' + e.message, 'err');
    setStateUI('error');
  };
}

// ── Estat de fallback CDN ──────────────────────────────
var _triedFallback = false;

// ── Handlers de missatges del worker ─────────────────────
var _handlers = {
  ready: function() {
    state.pyodideReady = true;
    _triedFallback = false;   // Reset per a futures recàrregues
    consoleClear();
    setStateUI('idle');
    // Executa el que esperava que Python estigués llest (vegeu whenReady)
    var cua = _readyQueue;
    _readyQueue = [];
    cua.forEach(function(fn) { fn(); });
  },
  load_error: function(d) {
    // Si encara no hem provat el CDN alternatiu, torna a provar automàticament
    if (!_triedFallback && PYODIDE_CDN_FALLBACK && d.cdnUrl !== PYODIDE_CDN_FALLBACK) {
      _triedFallback = true;
      consolePush(tr('log.load_retry'), 'dim');
      // Mata el worker actual i spawna un de nou amb el CDN alternatiu
      if (state.worker) {
        state.worker.terminate();
        state.worker = null;
      }
      _spawnWorker();
      state.worker.postMessage({ type: 'init', cdnUrl: PYODIDE_CDN_FALLBACK });
      return;
    }
    // Tots els CDN han fallat — mostra l'error i el botó de reintentar
    consoleClear();
    consolePush(tr('log.load_error'), 'err');
    setStateUI('error');
    _showRetryButton();
  },
  stdout: function(d) {
    consolePush(d.text, 'out');
    _currentOutput.push(d.text);
  },
  stdout_partial: function(d) {
    // Prompt d'input() — mostra com a línia parcial
    consolePushPartial(d.text);
  },
  stderr: function(d) {
    consolePush(d.text, 'err');
  },
  done: function(d) {
    _clearTimeout();
    state.running = false;
    consolePush(tr('log.done') + ' (' + d.elapsed + 'ms)', 'ok');
    setStateUI('done');
    if (d.turtle && turtleShow) turtleShow(d.turtle);
    var cb = _onDone;
    _onDone = null;   // ← FIX: nul·lifica ABANS de cridar per evitar doble invocació
    if (cb) cb(d.output != null ? d.output : _currentOutput.join('\n'));
  },
  error: function(d) {
    _clearTimeout();
    state.running = false;
    _showError(d.msg, d.line);
    if (d.turtle && turtleShow) turtleShow(d.turtle);   // el que s'ha dibuixat fins a l'error
    setStateUI('error');
    var cb = _onDone;
    _onDone = null;   // ← FIX: nul·lifica ABANS de cridar per evitar doble invocació
    if (cb) cb(null);
  },
  trace_result: function(d) {
    var cb = _onTrace;
    _onTrace = null;
    var data = null;
    try { data = d.data ? JSON.parse(d.data) : null; } catch (_) {}
    if (cb) cb(data);
  },
  check_result: function(d) {
    var cb = _onCheck;
    _onCheck = null;
    if (cb) cb(d.missing || []);
  },
  input_request: function() {
    // El worker necessita input de l'alumne
    _clearTimeout();  // Pausa el timeout mentre espera input

    consoleShowInput(function(text) {
      // L'alumne ha escrit i premut Enter
      _sendInputToWorker(text);
      // Reinicia el timeout
      _restartTimeout();
    });
  }
};

// ── Mostra un error: explicació en català + missatge original ──
// d.line és relativa al codi executat (codi de l'alumne + testCode):
// si cau dins del testCode, no es marca cap línia de l'editor.
function _showError(msg, line) {
  var userLines = state.userLineCount || Infinity;
  var inUserCode = line && line <= userLines;
  var info = explainError ? explainError(msg) : null;
  var where = inUserCode ? tr('log.error_line').replace('{n}', line)
            : (line ? tr('log.error_testcode') : tr('log.error'));

  if (info) {
    consolePush(where + ': ' + info.text, 'err');
    if (info.hint) consolePush('💡 ' + info.hint, 'hint');
    consolePush(msg, 'dim');                   // l'original, per aprendre a llegir-lo
  } else {
    consolePush(where + ': ' + msg, 'err');
  }
  if (inUserCode) markErrorLine(line);
}

// ── Envia l'input al worker via SharedArrayBuffer ────────
function _sendInputToWorker(text) {
  if (!_inputControl || !_inputSAB) return;
  var encoded = new TextEncoder().encode(text);
  var maxLen = INPUT_BUF_SIZE - 8;
  if (encoded.length > maxLen) encoded = encoded.slice(0, maxLen);
  var bytes = new Uint8Array(_inputSAB, 8);
  bytes.set(encoded);
  Atomics.store(_inputControl, 1, encoded.length);
  Atomics.store(_inputControl, 0, 2);   // input ready
  Atomics.notify(_inputControl, 0, 1);
}

// ── Estat d'una execució en curs ─────────────────────────
var _currentOutput = [];
var _timeoutId     = null;
var _onDone        = null;

function _clearTimeout() {
  if (_timeoutId) { clearTimeout(_timeoutId); _timeoutId = null; }
}

function _restartTimeout() {
  _clearTimeout();
  _timeoutId = setTimeout(_onTimeout, EXEC_TIMEOUT);
}

function _onTimeout() {
  pyKill();
  consolePush(tr('log.timeout'), 'err');
  setStateUI('error');
  // _onDone ja s'ha nul·lificat dins pyKill()
  // Re-spawna per a la propera execució
  _spawnWorker();
  state.worker.postMessage({ type: 'init', cdnUrl: PYODIDE_CDN });
}

// ── Botó "Torna a provar" per errors de càrrega ────────
function _showRetryButton() {
  var consol = document.getElementById('console-output');
  if (!consol) return;
  var btn = document.createElement('button');
  btn.textContent = tr('ui.retry');
  btn.className = 'retry-btn';
  btn.onclick = function() {
    btn.remove();
    _triedFallback = false;
    pyInit();
  };
  consol.appendChild(btn);
}

// ── API pública ──────────────────────────────────────────

// Inicialitza Pyodide (carrega el runtime al worker)
function pyInit() {
  _triedFallback = false;
  _spawnWorker();
  setStateUI('loading');
  consolePush(tr('log.loading'), 'dim');
  state.worker.postMessage({ type: 'init', cdnUrl: PYODIDE_CDN });
}

// Executa codi Python.
// stdin: string o null
// onDone(output): callback amb el text complet de stdout (o null si error)
// interactive: boolean (forçar mode interactiu)
function pyRun(code, stdin, onDone, interactive) {
  var S = state;

  // Si Python encara no és a punt, s'executa quan ho sigui
  // (i, si el worker no existeix, primer es carrega: càrrega sota demanda)
  if (!S.worker || !S.pyodideReady) {
    if (!S.worker) {
      _spawnWorker();
      setStateUI('loading');
      consolePush(tr('log.loading'), 'dim');
      S.worker.postMessage({ type: 'init', cdnUrl: PYODIDE_CDN });
    }
    whenReady(function() { pyRun(code, stdin, onDone, interactive); });
    return;
  }

  // Reset
  _currentOutput = [];
  _onDone = onDone || null;
  S.running = true;
  S.startTime = Date.now();

  clearLineMarks();
  setStateUI('running');
  consolePush(tr('log.running'), 'dim');

  // Timeout de seguretat
  _timeoutId = setTimeout(_onTimeout, EXEC_TIMEOUT);

  // Determina si usar mode interactiu
  var useInteractive = interactive && _canInteractive;
  if (useInteractive) _ensureInputBuffer();

  // Envia al worker
  S.worker.postMessage({
    type:         'run',
    code:         code,
    stdin:        stdin,
    interactive:  useInteractive,
    inputBuffer:  useInteractive ? _inputSAB : null
  });
}

// Versió Promise (més còmoda per a iteracions)
function pyRunAsync(code, stdin, interactive) {
  return new Promise(function(resolve) {
    pyRun(code, stdin, function(output) { resolve(output); }, interactive);
  });
}

// Comprova els requisits d'un exercici (data-requires) sobre el codi de
// l'alumne. Retorna Promise<array de descripcions dels que falten>.
// Només es crida després d'una validació, amb Python ja carregat.
var _onCheck = null;
function pyCheck(code, requires) {
  return new Promise(function(resolve) {
    var S = state;
    if (!requires || !S.worker || !S.pyodideReady) { resolve([]); return; }
    _onCheck = resolve;
    S.worker.postMessage({ type: 'check', code: code, requires: requires });
  });
}

// Enregistra una execució pas a pas (pycat_trace.py). Carrega Python si
// cal. Retorna Promise<{passos, sortida, error, tallat} | null>.
var _onTrace = null;
function pyTrace(code, stdin, userLines) {
  return new Promise(function(resolve) {
    var S = state;
    function envia() {
      // Límit de temps (p. ex. un càlcul enorme dins d'una sola línia)
      var t = setTimeout(function() {
        _onTrace = null;
        pyStop();
        resolve(null);
      }, EXEC_TIMEOUT);
      _onTrace = function(data) { clearTimeout(t); resolve(data); };
      S.worker.postMessage({ type: 'trace', code: code, stdin: stdin, userLines: userLines });
    }
    if (!S.worker) {
      _spawnWorker();
      setStateUI('loading');
      consolePush(tr('log.loading'), 'dim');
      S.worker.postMessage({ type: 'init', cdnUrl: PYODIDE_CDN });
    }
    whenReady(envia);
  });
}

// Crida fn() quan Python estigui llest (immediatament si ja ho és)
var _readyQueue = [];
function whenReady(fn) {
  if (state.pyodideReady) fn();
  else _readyQueue.push(fn);
}

// Mata el worker (atura qualsevol execució)
function pyKill() {
  var S = state;
  _clearTimeout();
  if (S.worker) {
    S.worker.terminate();
    S.worker = null;
  }
  S.running = false;
  S.pyodideReady = false;
  consoleHideInput();
  var cb = _onDone;
  _onDone = null;
  if (cb) cb(null);
}

// Atura i re-spawna (per a poder executar de nou)
function pyStop() {
  pyKill();
  _spawnWorker();
  setStateUI('loading');
  consolePush(tr('log.restarting'), 'dim');
  state.worker.postMessage({ type: 'init', cdnUrl: PYODIDE_CDN });
}


// ── Exporta al namespace P ───────────────────────────────
export { pyInit };
export { pyRun };
export { pyRunAsync };
export { pyCheck };
export { pyTrace };
export { pyKill };
export { pyStop };
export { canInteractive };
export { whenReady };
