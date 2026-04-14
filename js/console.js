// ════════════════════════════════════════════════════════
// console.js — Panell de sortida (substitueix renderer.js)
//
// En lloc de la graella visual de Karel, PyCat mostra una
// consola de text amb stdout, stderr i missatges del sistema.
//
// Classes de línia:
//   out  — stdout (blanc/verd)
//   err  — stderr/errors (vermell)
//   ok   — missatge d'èxit (verd)
//   dim  — info del sistema (gris)
// ════════════════════════════════════════════════════════

function consolePush(text, type) {
  const el = document.getElementById('console-output');
  if (!el) return;
  const line = document.createElement('div');
  line.className = 'con-line ' + (type || 'out');
  line.textContent = text;
  el.appendChild(line);
  el.scrollTop = el.scrollHeight;
}

function consoleClear() {
  const el = document.getElementById('console-output');
  if (el) el.innerHTML = '';
}

P.consolePush = consolePush;
P.consoleClear = consoleClear;
