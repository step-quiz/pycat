// ════════════════════════════════════════════════════════
// curs/capitols.js — Dades dels capítols i helpers de UI
//
// Funcions exportades al window global (idèntic a KarelCat):
//   injectCursLogo()           — pobla .logo-icon
//   renderSidebar(currentNum)  — omple #sidebar-nav
//   renderReptesSidebar(num)   — sidebar pels reptes
//   renderSimuladors()         — converteix .simulador → iframes
//   initSidebarToggle()        — hamburger mòbil
// ════════════════════════════════════════════════════════


// ── Logo ─────────────────────────────────────────────────
function injectCursLogo() {
  document.querySelectorAll('.logo-icon').forEach(el => {
    if (!el.innerHTML.trim()) el.innerHTML = '🐍';
  });
}


// ── Dades dels capítols ──────────────────────────────────
// ESCALAR: afegir capítols aquí i crear el fitxer HTML corresponent.

const CAPITOLS_DATA = [
  { num: 1,  titol: 'Hola, Python!',        arxiu: 'capitol-1.html' },
  { num: 2,  titol: 'Variables',             arxiu: 'capitol-2.html' },
  { num: 3,  titol: 'Operacions i input',    arxiu: 'capitol-3.html' },
  // ...afegir capítols aquí
];

const REPTES_DATA = [
  { num: 1,  titol: 'El primer programa',    arxiu: 'repte-1.html' },
  // { num: 2,  titol: 'La suma',              arxiu: 'repte-2.html' },
  // ...afegir reptes aquí
];


// ── Sidebar: capítols ────────────────────────────────────

function renderSidebar(currentNum) {
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;

  let html = '<div class="sidebar-section-title">Capítols</div>';
  html += '<ul class="sidebar-list">';
  for (const c of CAPITOLS_DATA) {
    const isActive = c.num === currentNum;
    html += `<li class="sidebar-item${isActive ? ' active' : ''}">
      <a href="${c.arxiu}">${c.num}. ${c.titol}</a>
    </li>`;
  }
  html += '</ul>';

  html += '<div class="sidebar-section-title" style="margin-top:1.2rem">Reptes</div>';
  html += '<ul class="sidebar-list">';
  for (const r of REPTES_DATA) {
    html += `<li class="sidebar-item">
      <a href="${r.arxiu}">Repte ${r.num}: ${r.titol}</a>
    </li>`;
  }
  html += '</ul>';

  nav.innerHTML = html;
}

// ── Sidebar: reptes ──────────────────────────────────────

function renderReptesSidebar(currentNum) {
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;

  let html = '<div class="sidebar-section-title">Capítols</div>';
  html += '<ul class="sidebar-list">';
  for (const c of CAPITOLS_DATA) {
    html += `<li class="sidebar-item">
      <a href="${c.arxiu}">${c.num}. ${c.titol}</a>
    </li>`;
  }
  html += '</ul>';

  html += '<div class="sidebar-section-title" style="margin-top:1.2rem">Reptes</div>';
  html += '<ul class="sidebar-list">';
  for (const r of REPTES_DATA) {
    const isActive = r.num === currentNum;
    html += `<li class="sidebar-item${isActive ? ' active' : ''}">
      <a href="${r.arxiu}">Repte ${r.num}: ${r.titol}</a>
    </li>`;
  }
  html += '</ul>';

  nav.innerHTML = html;
}


// ── Renderitzador de simuladors incrustats ────────────────
// Converteix cada <div class="simulador" data-...> en un iframe
// que apunta a simulador.html amb paràmetres codificats.
//
// Atributs suportats:
//   data-code       Codi inicial (text pla)
//   data-readonly   "true" per fer l'editor no editable
//   data-height     Alçada de l'iframe en px
//   data-stdin      Input predefinit per a input()
//   data-expected   Output esperat (validació simple)
//   data-tests      JSON de test cases (validació múltiple)
//   data-testcode   Codi de test unitari
//   data-goal-id    Identificador del repte

function renderSimuladors() {
  document.querySelectorAll('.simulador').forEach(div => {
    const code     = div.getAttribute('data-code') || '';
    const readonly = div.getAttribute('data-readonly') === 'true';
    const height   = div.getAttribute('data-height') || '320';
    const stdin    = div.getAttribute('data-stdin') || '';
    const expected = div.getAttribute('data-expected') || '';
    const tests    = div.getAttribute('data-tests') || '';
    const testcode = div.getAttribute('data-testcode') || '';
    const goalId   = div.getAttribute('data-goal-id') || '';

    // Construeix la URL de l'iframe
    const params = new URLSearchParams();
    params.set('embed', '1');
    params.set('theme', 'light');   // el curs sempre és clar per defecte

    if (code)     params.set('code', btoa(unescape(encodeURIComponent(code))));
    if (readonly) params.set('readonly', '1');
    if (stdin)    params.set('stdin', btoa(unescape(encodeURIComponent(stdin))));
    if (expected) params.set('expected', btoa(unescape(encodeURIComponent(expected))));
    if (tests)    params.set('tests', btoa(unescape(encodeURIComponent(tests))));
    if (testcode) params.set('testcode', btoa(unescape(encodeURIComponent(testcode))));
    if (goalId)   params.set('goalId', goalId);

    const iframe = document.createElement('iframe');
    iframe.src = '../simulador.html?' + params.toString();
    iframe.style.width = '100%';
    iframe.style.height = height + 'px';
    iframe.style.border = '1px solid #d0d0d0';
    iframe.style.borderRadius = '8px';
    iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin');
    iframe.setAttribute('loading', 'lazy');

    div.innerHTML = '';
    div.appendChild(iframe);

    // Feedback visual (per a reptes amb validació)
    if (goalId) {
      const fb = document.createElement('div');
      fb.className = 'simulador-feedback';
      fb.setAttribute('data-goal-id', goalId);
      div.appendChild(fb);
    }
  });
}


// ── Sidebar toggle (hamburger mòbil) ─────────────────────

function initSidebarToggle() {
  const toggle  = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebar-overlay');
  if (!toggle || !sidebar) return;

  const open = () => {
    sidebar.classList.add('open');
    if (overlay) overlay.classList.add('visible');
    toggle.setAttribute('aria-expanded', 'true');
  };
  const close = () => {
    sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('visible');
    toggle.setAttribute('aria-expanded', 'false');
  };

  toggle.addEventListener('click', () => {
    sidebar.classList.contains('open') ? close() : open();
  });

  if (overlay) overlay.addEventListener('click', close);
}


// ── Listener de feedback des dels iframes ────────────────

window.addEventListener('message', function(e) {
  if (!e.data) return;
  const { type, goalId, success } = e.data;

  if (type === 'pycat-clear') {
    const fb = document.querySelector(`.simulador-feedback[data-goal-id="${goalId}"]`);
    if (fb) { fb.className = 'simulador-feedback'; fb.textContent = ''; }
    return;
  }

  if (type === 'pycat-result') {
    const fb = document.querySelector(`.simulador-feedback[data-goal-id="${goalId}"]`);
    if (!fb) return;
    if (success) {
      fb.className = 'simulador-feedback fb-ok';
      fb.textContent = '✓ Correcte! El programa funciona bé.';
    } else {
      fb.className = 'simulador-feedback fb-ko';
      fb.textContent = '✗ La sortida no coincideix amb l\'esperada. Revisa el codi.';
    }
  }
});


// ── Exporta ──────────────────────────────────────────────
window.injectCursLogo      = injectCursLogo;
window.renderSidebar       = renderSidebar;
window.renderReptesSidebar = renderReptesSidebar;
window.renderSimuladors    = renderSimuladors;
window.initSidebarToggle   = initSidebarToggle;
