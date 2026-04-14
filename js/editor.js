// ════════════════════════════════════════════════════════
// editor.js — Ressaltat sintàctic Python, numeració de línies
//
// Adaptat de KarelCat: mateixa mecànica (textarea + pre overlay),
// però amb keywords de Python real en lloc de comandes Karel.
// ════════════════════════════════════════════════════════

// ── Vocabulari Python per al ressaltat ───────────────────
const PY_KEYWORDS = new Set([
  'if','elif','else','for','while','def','return','class',
  'import','from','as','try','except','finally','raise',
  'with','pass','break','continue','and','or','not','in',
  'is','None','True','False','lambda','yield','global',
  'nonlocal','del','assert',
]);

const PY_BUILTINS = new Set([
  'print','input','range','len','int','float','str','bool',
  'list','dict','set','tuple','type','abs','max','min',
  'sum','sorted','reversed','enumerate','zip','map','filter',
  'open','round','format','isinstance','hasattr','getattr',
  'append','extend','pop','insert','remove','index','count',
  'join','split','strip','replace','find','upper','lower',
  'startswith','endswith','keys','values','items',
]);

// ── Tokenitza una línia per al ressaltat ─────────────────
function tokenizeLine(line) {
  let out = '', i = 0;
  while (i < line.length) {
    const c = line[i];

    // Espai en blanc
    if (/\s/.test(c)) {
      let ws = '';
      while (i < line.length && /\s/.test(line[i])) ws += line[i++];
      out += P.escHtml(ws);
      continue;
    }

    // String (cometes simples o dobles)
    if (c === '"' || c === "'") {
      const q = c;
      let s = c; i++;
      // Detecta triple-quote
      if (i < line.length - 1 && line[i] === q && line[i+1] === q) {
        s += q + q; i += 2;
        // Consumeix fins a triple-quote de tancament o final de línia
        while (i < line.length) {
          if (line[i] === q && i+2 < line.length && line[i+1] === q && line[i+2] === q) {
            s += q + q + q; i += 3; break;
          }
          s += line[i++];
        }
      } else {
        while (i < line.length && line[i] !== q) {
          if (line[i] === '\\' && i + 1 < line.length) { s += line[i++]; }
          s += line[i++];
        }
        if (i < line.length) s += line[i++]; // tancament
      }
      out += `<span class="hl-str">${P.escHtml(s)}</span>`;
      continue;
    }

    // Puntuació
    if ('()[]{}:,.=+-*/<>!%@&|^~'.includes(c)) {
      out += `<span class="hl-br">${P.escHtml(c)}</span>`;
      i++;
      continue;
    }

    // Número
    if (/[0-9]/.test(c)) {
      let n = '';
      while (i < line.length && /[0-9.]/.test(line[i])) n += line[i++];
      out += `<span class="hl-num">${n}</span>`;
      continue;
    }

    // Paraula (identificador)
    if (/[a-zA-Z_]/.test(c)) {
      let w = '';
      while (i < line.length && /[a-zA-Z0-9_]/.test(line[i])) w += line[i++];
      if (PY_KEYWORDS.has(w))      out += `<span class="hl-kw">${P.escHtml(w)}</span>`;
      else if (PY_BUILTINS.has(w)) out += `<span class="hl-cmd">${P.escHtml(w)}</span>`;
      else                         out += `<span class="hl-user">${P.escHtml(w)}</span>`;
      continue;
    }

    // Caràcter no reconegut
    out += P.escHtml(line[i++]);
  }
  return out;
}

// ── Ressaltat complet del codi ───────────────────────────
function highlightCode(code) {
  return code.split('\n').map((line, i) => {
    const ln = i + 1;
    const ci = line.indexOf('#');
    const content = ci !== -1
      ? tokenizeLine(line.slice(0, ci)) + `<span class="hl-cm">${P.escHtml(line.slice(ci))}</span>`
      : tokenizeLine(line);
    return `<span class="code-line" id="cln-${ln}">${content}</span>`;
  }).join('\n');
}

// ── Fons de línies (per marcar activa/error) ─────────────
function updateLineBg(numLines) {
  const bg = document.getElementById('line-bg');
  if (!bg) return;
  bg.innerHTML = Array.from({ length: numLines }, (_, i) =>
    `<div class="lbg-row" id="lbg-${i + 1}"></div>`
  ).join('');
}

// ── Marcatge de línies ───────────────────────────────────
function highlightLine(n) {
  document.querySelectorAll('.lbg-row.active').forEach(el => el.classList.remove('active'));
  if (!n) return;
  const row = document.getElementById('lbg-' + n);
  if (row) row.classList.add('active');
}

function markErrorLine(n) {
  if (n) document.getElementById('lbg-' + n)?.classList.add('error');
}

function clearLineMarks() {
  document.querySelectorAll('.lbg-row.active, .lbg-row.error')
    .forEach(el => el.classList.remove('active', 'error'));
}

// ── Actualitza editor (sync textarea → pre + line numbers) ──
function updateEditor() {
  const ta = document.getElementById('code-editor');
  const hl = document.getElementById('code-highlight');
  const ln = document.getElementById('line-numbers');
  if (!ta) return;

  const code  = ta.value;
  const lines = code.split('\n');

  if (hl) hl.innerHTML = highlightCode(code);
  if (ln) ln.innerHTML = lines.map((_, i) =>
    `<div class="ln">${i + 1}</div>`
  ).join('');

  updateLineBg(lines.length);

  // Guarda al localStorage (si no estem en mode embed)
  if (!document.body.classList.contains('embed')) {
    try { localStorage.setItem(P.LS_KEY_CODE, code); } catch(_) {}
  }
}

// ── Inicialitza l'editor ─────────────────────────────────
function initEditor() {
  const ta = document.getElementById('code-editor');
  if (!ta) return;

  // Sync scroll entre textarea, highlight i line-numbers
  ta.addEventListener('scroll', function() {
    const hl = document.getElementById('code-highlight');
    const bg = document.getElementById('line-bg');
    const ln = document.getElementById('line-numbers');
    if (hl) hl.scrollTop = ta.scrollTop;
    if (bg) bg.scrollTop = ta.scrollTop;
    if (ln) ln.scrollTop = ta.scrollTop;
    if (hl) hl.scrollLeft = ta.scrollLeft;
  });

  // Actualitza el ressaltat a cada input
  ta.addEventListener('input', updateEditor);

  // Tab → 4 espais (com KarelCat)
  ta.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = ta.selectionStart;
      const end   = ta.selectionEnd;
      ta.value = ta.value.substring(0, start) + '    ' + ta.value.substring(end);
      ta.selectionStart = ta.selectionEnd = start + 4;
      updateEditor();
    }
  });
}


// ── Exporta ──────────────────────────────────────────────
P.initEditor    = initEditor;
P.updateEditor  = updateEditor;
P.highlightLine = highlightLine;
P.markErrorLine = markErrorLine;
P.clearLineMarks = clearLineMarks;
