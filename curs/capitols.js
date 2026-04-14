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

  nav.innerHTML = html;
}

// ── Sidebar: reptes ──────────────────────────────────────

function renderReptesSidebar(currentNum) {
  const nav = document.getElementById('sidebar-nav');
  if (!nav) return;

  let html = '<div class="sidebar-section-title">Reptes</div>';
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


// ── Glossari — injectat dinàmicament a capítols i reptes ──────────

function initGlossariCurs() {
  const header = document.querySelector('.curs-header');
  if (!header) return;

  // Botó a la capçalera (dins .curs-header-actions si existeix)
  const btn = document.createElement('button');
  btn.className = 'glossari-curs-btn';
  btn.id = 'btn-glossari-curs';
  btn.textContent = '📖 Glossari';
  btn.type = 'button';
  const actions = header.querySelector('.curs-header-actions');
  (actions || header).appendChild(btn);

  // Modal
  const overlay = document.createElement('div');
  overlay.className = 'glossari-overlay';
  overlay.id = 'glossari-overlay';
  overlay.innerHTML = `
    <div class="glossari-modal" id="glossari-modal">
      <div class="glossari-header">
        <span class="glossari-title">📖 Glossari</span>
        <button class="glossari-close" id="glossari-close" aria-label="Tanca" type="button">✕</button>
      </div>
      <div class="glossari-body">

        <div class="glossari-section">
          <h3>Funcions bàsiques</h3>
          <p class="glossari-hint">Sempre amb parèntesis <code>()</code></p>
          <div class="glossari-grid">
            <code>print(x)</code><span>Mostra <code>x</code> a la consola</span>
            <code>input()</code><span>Llegeix una línia de l'usuari (retorna <code>str</code>)</span>
            <code>input("?")</code><span>Mostra un missatge i llegeix la resposta</span>
            <code>int(x)</code><span>Converteix <code>x</code> a nombre enter</span>
            <code>float(x)</code><span>Converteix <code>x</code> a nombre amb decimals</span>
            <code>str(x)</code><span>Converteix <code>x</code> a text</span>
            <code>len(x)</code><span>Longitud d'un text o llista</span>
          </div>
        </div>

        <div class="glossari-section">
          <h3>Tipus de dades</h3>
          <div class="glossari-grid">
            <code>int</code><span>Nombre enter: <code>3</code>, <code>-7</code>, <code>0</code></span>
            <code>float</code><span>Nombre amb decimals: <code>3.14</code>, <code>-0.5</code></span>
            <code>str</code><span>Text entre cometes: <code>"hola"</code>, <code>'món'</code></span>
            <code>bool</code><span>Cert o fals: <code>True</code>, <code>False</code></span>
          </div>
        </div>

        <div class="glossari-section">
          <h3>Operadors aritmètics</h3>
          <div class="glossari-grid">
            <code>+</code><span>Suma (o concatena textos)</span>
            <code>-</code><span>Resta</span>
            <code>*</code><span>Multiplicació</span>
            <code>/</code><span>Divisió (sempre retorna <code>float</code>)</span>
            <code>//</code><span>Divisió entera (descarta els decimals)</span>
            <code>%</code><span>Mòdul (residu de la divisió)</span>
            <code>**</code><span>Potència (<code>2**3</code> = 8)</span>
          </div>
        </div>

        <div class="glossari-section">
          <h3>Comparacions</h3>
          <p class="glossari-hint">S'usen dins de <code>if</code> i <code>while</code> — retornen <code>True</code> o <code>False</code></p>
          <div class="glossari-grid">
            <code>==</code><span>Igual a</span>
            <code>!=</code><span>Diferent de</span>
            <code>&lt;</code><span>Menor que</span>
            <code>&gt;</code><span>Major que</span>
            <code>&lt;=</code><span>Menor o igual</span>
            <code>&gt;=</code><span>Major o igual</span>
            <code>and</code><span>I (les dues han de ser certes)</span>
            <code>or</code><span>O (almenys una ha de ser certa)</span>
            <code>not</code><span>Negació</span>
          </div>
        </div>

        <div class="glossari-section">
          <h3>Estructures</h3>
          <p class="glossari-hint">Acaben amb dos punts <code>:</code> i el bloc interior va <strong>indentat</strong> (4 espais)</p>
          <pre class="glossari-example">edat = int(input("Edat: "))
if edat &gt;= 18:
    print("Adult")
elif edat &gt;= 13:
    print("Adolescent")
else:
    print("Infant")</pre>
          <pre class="glossari-example">while resposta != "sí":
    resposta = input("Continuem? ")</pre>
          <pre class="glossari-example">for i in range(5):
    print(i)</pre>
          <pre class="glossari-example">def saluda(nom):
    print("Hola, " + nom)</pre>
        </div>

        <div class="glossari-section glossari-rules">
          <h3>Recorda</h3>
          <div class="glossari-rule">① Les funcions sempre porten <code>()</code> al final</div>
          <div class="glossari-rule">② Després de <code>if</code>, <code>while</code>, <code>for</code>, <code>def</code> cal posar <code>:</code></div>
          <div class="glossari-rule">③ El codi dins d'un bloc s'ha d'indentar (4 espais)</div>
          <div class="glossari-rule">④ <code>input()</code> sempre retorna <code>str</code> — usa <code>int()</code> o <code>float()</code> per convertir</div>
          <div class="glossari-rule">⑤ Els textos van entre cometes: <code>"hola"</code> o <code>'hola'</code></div>
        </div>

      </div>
    </div>`;
  document.body.appendChild(overlay);

  // Events
  btn.addEventListener('click', () => overlay.classList.toggle('is-open'));
  overlay.querySelector('#glossari-close').addEventListener('click', () => overlay.classList.remove('is-open'));
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.classList.remove('is-open'); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') overlay.classList.remove('is-open'); });
}

// Auto-init (capitols.js es carrega després del DOM)
initGlossariCurs();


// ── Exporta ──────────────────────────────────────────────
window.injectCursLogo      = injectCursLogo;
window.renderSidebar       = renderSidebar;
window.renderReptesSidebar = renderReptesSidebar;
window.renderSimuladors    = renderSimuladors;
window.initSidebarToggle   = initSidebarToggle;
window.initGlossariCurs    = initGlossariCurs;
