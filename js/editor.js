// ════════════════════════════════════════════════════════
// editor.js — Ressaltat sintàctic Python, numeració de línies
//
// El tokenitzador gestiona:
//   - Strings d'una línia ('...' i "...")
//   - Strings multilínia ('''...''' i """...""")
//   - Comentaris (#) que no es confonen amb # dins de strings
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
// Retorna { html: string, tripleState: null | '"' | "'" }
// tripleState indica si la línia acaba dins d'una triple-quoted string.
function tokenizeLine(line, tripleState) {
  let out = '', i = 0;

  // ── Continuació d'una triple-quoted string de línies anteriors ──
  if (tripleState) {
    let s = '';
    while (i < line.length) {
      if (line[i] === tripleState &&
          i + 1 < line.length && line[i + 1] === tripleState &&
          i + 2 < line.length && line[i + 2] === tripleState) {
        s += tripleState + tripleState + tripleState;
        i += 3;
        out += '<span class="hl-str">' + P.escHtml(s) + '</span>';
        tripleState = null;
        break;
      }
      if (line[i] === '\\' && i + 1 < line.length) {
        s += line[i++];
      }
      s += line[i++];
    }
    if (tripleState) {
      // Encara dins la string, consumeix tota la línia
      out += '<span class="hl-str">' + P.escHtml(s) + '</span>';
      return { html: out, tripleState: tripleState };
    }
  }

  // ── Tokenització normal ────────────────────────────────
  while (i < line.length) {
    var c = line[i];

    // Comentari (fins a final de línia)
    if (c === '#') {
      out += '<span class="hl-cm">' + P.escHtml(line.slice(i)) + '</span>';
      break;
    }

    // Espai en blanc
    if (/\s/.test(c)) {
      var ws = '';
      while (i < line.length && /\s/.test(line[i])) ws += line[i++];
      out += P.escHtml(ws);
      continue;
    }

    // String (cometes simples o dobles)
    if (c === '"' || c === "'") {
      var q = c;
      var s = c; i++;

      // Detecta triple-quote
      if (i < line.length && line[i] === q &&
          i + 1 < line.length && line[i + 1] === q) {
        s += q + q; i += 2;

        // Busca el tancament de la triple-quote a la mateixa línia
        var closed = false;
        while (i < line.length) {
          if (line[i] === '\\' && i + 1 < line.length) {
            s += line[i++];
            s += line[i++];
            continue;
          }
          if (line[i] === q &&
              i + 1 < line.length && line[i + 1] === q &&
              i + 2 < line.length && line[i + 2] === q) {
            s += q + q + q; i += 3;
            closed = true;
            break;
          }
          s += line[i++];
        }

        out += '<span class="hl-str">' + P.escHtml(s) + '</span>';
        if (!closed) {
          // La triple-quote continua a la línia següent
          tripleState = q;
          return { html: out, tripleState: tripleState };
        }
        continue;
      }

      // String normal (una sola línia)
      while (i < line.length && line[i] !== q) {
        if (line[i] === '\\' && i + 1 < line.length) { s += line[i++]; }
        s += line[i++];
      }
      if (i < line.length) s += line[i++]; // tancament
      out += '<span class="hl-str">' + P.escHtml(s) + '</span>';
      continue;
    }

    // Puntuació
    if ('()[]{}:,.=+-*/<>!%@&|^~'.includes(c)) {
      out += '<span class="hl-br">' + P.escHtml(c) + '</span>';
      i++;
      continue;
    }

    // Número
    if (/[0-9]/.test(c)) {
      var n = '';
      var hasDot = false;
      while (i < line.length && /[0-9.]/.test(line[i])) {
        if (line[i] === '.') {
          if (hasDot) break;  // Segon punt: atura (no és part del número)
          hasDot = true;
        }
        n += line[i++];
      }
      out += '<span class="hl-num">' + P.escHtml(n) + '</span>';
      continue;
    }

    // Paraula (identificador)
    if (/[a-zA-Z_]/.test(c)) {
      var w = '';
      while (i < line.length && /[a-zA-Z0-9_]/.test(line[i])) w += line[i++];
      if (PY_KEYWORDS.has(w))      out += '<span class="hl-kw">' + P.escHtml(w) + '</span>';
      else if (PY_BUILTINS.has(w)) out += '<span class="hl-cmd">' + P.escHtml(w) + '</span>';
      else                         out += '<span class="hl-user">' + P.escHtml(w) + '</span>';
      continue;
    }

    // Caràcter no reconegut
    out += P.escHtml(line[i++]);
  }

  return { html: out, tripleState: tripleState || null };
}

// ── Ressaltat complet del codi ───────────────────────────
function highlightCode(code) {
  var tripleState = null;
  return code.split('\n').map(function(line, i) {
    var ln = i + 1;
    var result = tokenizeLine(line, tripleState);
    tripleState = result.tripleState;
    return '<span class="code-line" id="cln-' + ln + '">' + result.html + '</span>';
  }).join('\n');
}

// ── Fons de línies (per marcar activa/error) ─────────────
function updateLineBg(numLines) {
  var bg = document.getElementById('line-bg');
  if (!bg) return;
  bg.innerHTML = Array.from({ length: numLines }, function(_, i) {
    return '<div class="lbg-row" id="lbg-' + (i + 1) + '"></div>';
  }).join('');
}

// ── Marcatge de línies ───────────────────────────────────
function highlightLine(n) {
  document.querySelectorAll('.lbg-row.active').forEach(function(el) { el.classList.remove('active'); });
  if (!n) return;
  var row = document.getElementById('lbg-' + n);
  if (row) row.classList.add('active');
}

function markErrorLine(n) {
  if (n) {
    var el = document.getElementById('lbg-' + n);
    if (el) el.classList.add('error');
  }
}

function clearLineMarks() {
  document.querySelectorAll('.lbg-row.active, .lbg-row.error')
    .forEach(function(el) { el.classList.remove('active', 'error'); });
}

// ── Actualitza editor (sync textarea → pre + line numbers) ──
function updateEditor() {
  var ta = document.getElementById('code-editor');
  var hl = document.getElementById('code-highlight');
  var ln = document.getElementById('line-numbers');
  if (!ta) return;

  var code  = ta.value;
  var lines = code.split('\n');

  if (hl) hl.innerHTML = highlightCode(code);
  if (ln) ln.innerHTML = lines.map(function(_, i) {
    return '<div class="ln">' + (i + 1) + '</div>';
  }).join('');

  updateLineBg(lines.length);

  // Guarda al localStorage (si no estem en mode embed)
  if (!document.body.classList.contains('embed')) {
    try { localStorage.setItem(P.LS_KEY_CODE, code); } catch(_) {}
  }
}

// ── Inicialitza l'editor ─────────────────────────────────
function initEditor() {
  var ta = document.getElementById('code-editor');
  if (!ta) return;

  // Sync scroll entre textarea, highlight i line-numbers
  ta.addEventListener('scroll', function() {
    var hl = document.getElementById('code-highlight');
    var bg = document.getElementById('line-bg');
    var ln = document.getElementById('line-numbers');
    if (hl) hl.scrollTop = ta.scrollTop;
    if (bg) bg.scrollTop = ta.scrollTop;
    if (ln) ln.scrollTop = ta.scrollTop;
    if (hl) hl.scrollLeft = ta.scrollLeft;
  });

  // Actualitza el ressaltat a cada input
  ta.addEventListener('input', updateEditor);

  // Tab / Shift+Tab → indentació / desindentació (4 espais)
  ta.addEventListener('keydown', function(e) {
    if (e.key !== 'Tab') return;
    e.preventDefault();

    var start = ta.selectionStart;
    var end   = ta.selectionEnd;
    var val   = ta.value;

    // ── Trobar les línies afectades ──────────────────────
    var lineStart = val.lastIndexOf('\n', start - 1) + 1;
    var lineEnd   = val.indexOf('\n', end);
    if (lineEnd === -1) lineEnd = val.length;

    var block     = val.substring(lineStart, lineEnd);
    var lines     = block.split('\n');
    var multiLine = (start !== end && lines.length > 1);

    if (e.shiftKey) {
      // ── Shift+Tab: desindenta ────────────────────────
      var removed = 0;
      var firstRemoved = 0;
      var newLines = lines.map(function(ln, idx) {
        var m = ln.match(/^( {1,4})/);
        if (m) {
          var r = m[1].length;
          if (idx === 0) firstRemoved = r;
          removed += r;
          return ln.substring(r);
        }
        return ln;
      });
      var newBlock = newLines.join('\n');
      ta.value = val.substring(0, lineStart) + newBlock + val.substring(lineEnd);

      // Preserva la selecció
      var newStart = Math.max(lineStart, start - firstRemoved);
      if (multiLine) {
        ta.selectionStart = newStart;
        ta.selectionEnd   = end - removed;
      } else {
        ta.selectionStart = ta.selectionEnd = newStart;
      }
    } else if (multiLine) {
      // ── Tab amb selecció multilínia: indenta tot ─────
      var newLines = lines.map(function(ln) { return '    ' + ln; });
      var newBlock = newLines.join('\n');
      ta.value = val.substring(0, lineStart) + newBlock + val.substring(lineEnd);
      ta.selectionStart = start + 4;
      ta.selectionEnd   = end + (lines.length * 4);
    } else {
      // ── Tab normal: insereix 4 espais ────────────────
      ta.value = val.substring(0, start) + '    ' + val.substring(end);
      ta.selectionStart = ta.selectionEnd = start + 4;
    }

    updateEditor();
  });
}


// ── Exporta ──────────────────────────────────────────────
P.initEditor     = initEditor;
P.updateEditor   = updateEditor;
P.highlightLine  = highlightLine;
P.markErrorLine  = markErrorLine;
P.clearLineMarks = clearLineMarks;
