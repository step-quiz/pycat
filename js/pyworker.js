// ════════════════════════════════════════════════════════
// pyworker.js — Web Worker que executa Python via Pyodide
//
// Viu en un fil separat. Comunicació via postMessage.
// El main thread pot fer worker.terminate() per matar
// bucles infinits sense bloquejar la UI.
//
// Estratègia de captura de stdout/stderr:
//   Capturem stdout/stderr en StringIO dins de Python
//   i els llegim des de JS un cop acaba l'execució.
//   Això és simple i fiable (evita la complexitat de
//   cridar postMessage des de Python via FFI).
//
// Protocol:
//   Main → Worker:  {type:'init', cdnUrl}
//   Main → Worker:  {type:'run', code, stdin}
//   Worker → Main:  {type:'ready'}
//   Worker → Main:  {type:'stdout', text}
//   Worker → Main:  {type:'stderr', text}
//   Worker → Main:  {type:'done', elapsed, output}
//   Worker → Main:  {type:'error', msg, line, elapsed}
// ════════════════════════════════════════════════════════

let pyodide = null;

// ── Inicialització ───────────────────────────────────────
async function initPyodide(cdnUrl) {
  try {
    importScripts(cdnUrl + 'pyodide.js');
    pyodide = await loadPyodide({ indexURL: cdnUrl });

    // Guardem stdout/stderr originals (una sola vegada)
    pyodide.runPython(`
import sys
from io import StringIO
_orig_stdout = sys.stdout
_orig_stderr = sys.stderr
`);

    postMessage({ type: 'ready' });
  } catch (e) {
    postMessage({ type: 'error', msg: 'Error carregant Pyodide: ' + e.message });
  }
}

// ── Execució de codi ─────────────────────────────────────
async function runCode(code, stdin) {
  if (!pyodide) {
    postMessage({ type: 'error', msg: 'Python encara no està carregat.' });
    return;
  }

  const t0 = performance.now();

  try {
    // Redirigeix stdout/stderr a StringIO per capturar-los
    pyodide.runPython(`
import sys
from io import StringIO
_cap_out = StringIO()
_cap_err = StringIO()
sys.stdout = _cap_out
sys.stderr = _cap_err
`);

    // Injecta stdin si cal
    if (stdin !== undefined && stdin !== null && stdin !== '') {
      pyodide.runPython('sys.stdin = StringIO(' + JSON.stringify(stdin) + ')');
    }

    // Executa el codi de l'alumne
    await pyodide.runPythonAsync(code);

    // Llegeix la sortida capturada
    const stdout = pyodide.runPython('_cap_out.getvalue()');
    const stderr = pyodide.runPython('_cap_err.getvalue()');

    // Restaura stdout/stderr per a la propera execució
    pyodide.runPython('sys.stdout = _orig_stdout; sys.stderr = _orig_stderr');

    const elapsed = Math.round(performance.now() - t0);

    // Envia stdout línia per línia al main thread
    if (stdout) {
      const lines = stdout.split('\n');
      for (let i = 0; i < lines.length; i++) {
        // Ignora l'últim element buit (trailing newline de print)
        if (i === lines.length - 1 && lines[i] === '') continue;
        postMessage({ type: 'stdout', text: lines[i] });
      }
    }

    // Envia stderr si n'hi ha
    if (stderr) {
      const lines = stderr.split('\n').filter(function(l) { return l; });
      for (var j = 0; j < lines.length; j++) {
        postMessage({ type: 'stderr', text: lines[j] });
      }
    }

    postMessage({ type: 'done', elapsed: elapsed, output: stdout || '' });

  } catch (e) {
    // Intenta llegir qualsevol output parcial
    var partialOut = '';
    try {
      partialOut = pyodide.runPython('_cap_out.getvalue()') || '';
      if (partialOut) {
        var pLines = partialOut.split('\n');
        for (var k = 0; k < pLines.length; k++) {
          if (k === pLines.length - 1 && pLines[k] === '') continue;
          postMessage({ type: 'stdout', text: pLines[k] });
        }
      }
    } catch(_) {}

    // Restaura stdout/stderr
    try {
      pyodide.runPython('sys.stdout = _orig_stdout; sys.stderr = _orig_stderr');
    } catch(_) {}

    var elapsed2 = Math.round(performance.now() - t0);
    var msg = e.message || String(e);
    var line = null;

    // Intenta extreure el número de línia del traceback
    var lineMatch = msg.match(/line (\d+)/);
    if (lineMatch) line = parseInt(lineMatch[1], 10);

    // Neteja: agafa l'última línia significativa del traceback
    var msgLines = msg.split('\n').filter(function(l) { return l.trim(); });
    var lastLine = msgLines[msgLines.length - 1] || msg;

    postMessage({ type: 'error', msg: lastLine, line: line, elapsed: elapsed2 });
  }
}

// ── Dispatcher de missatges ──────────────────────────────
self.onmessage = function(e) {
  var type = e.data.type;
  if (type === 'init') {
    initPyodide(e.data.cdnUrl);
  } else if (type === 'run') {
    runCode(e.data.code, e.data.stdin);
  }
};
