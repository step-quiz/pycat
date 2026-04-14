# PyCat

Entorn interactiu per aprendre **Python real** al navegador, adreçat a alumnes que han completat [KarelCat](https://github.com/...) o equivalent. Seqüela independent amb la mateixa arquitectura web i la mateixa UI/UX.

## Què és

Un curs de capítols i reptes, accessible des del navegador sense instal·lació. L'alumne escriu Python real a l'editor (esquerra) i veu la sortida a la consola (dreta). Els reptes tenen validació automàtica.

**Motor:** [Pyodide](https://pyodide.org/) — CPython compilat a WebAssembly, executat dins d'un Web Worker per no bloquejar la UI.

## Com executar-lo

```bash
# Serveix els fitxers amb qualsevol servidor HTTP local
cd pycat/
python3 -m http.server 8000

# Obre al navegador
open http://localhost:8000/curs/index.html     # el curs
open http://localhost:8000/simulador.html       # el simulador lliure
```

> **Important:** Cal un servidor HTTP — obrir els fitxers directament (`file://`) no funciona perquè els Web Workers necessiten el protocol `http://` o `https://`.

La primera càrrega descarrega Pyodide (~12MB) des del CDN. Es cacheja al navegador i les càrregues posteriors són quasi instantànies.

## Estructura

```
pycat/
├── simulador.html          ← Simulador lliure (editor + consola Python)
├── style.css               ← Estils del simulador
├── js/
│   ├── constants.js        ← Configuració, i18n, namespace P
│   ├── state.js            ← Estat centralitzat
│   ├── pyworker.js         ← Web Worker amb Pyodide (motor Python)
│   ├── pyrunner.js         ← Gestió del Worker des del main thread
│   ├── console.js          ← Panell de sortida
│   ├── editor.js           ← Ressaltat sintàctic Python + numeració
│   ├── ui.js               ← Botons, tema, validació
│   └── main.js             ← Inicialització i paràmetres URL
├── curs/
│   ├── index.html          ← Índex del curs
│   ├── capitol-1.html      ← Capítol 1: Hola, Python!
│   ├── repte-1.html        ← Repte 1: El primer programa
│   ├── capitols.js         ← Motor del curs (sidebar, iframes, feedback)
│   └── curs.css            ← Estils del curs
└── docs/
```

## Com escalar

### Afegir un capítol

1. Crea `curs/capitol-N.html` (copia `capitol-1.html` com a plantilla)
2. Afegeix l'entrada a `CAPITOLS_DATA` dins `curs/capitols.js`

### Afegir un repte

1. Crea `curs/repte-N.html`
2. Usa els atributs `data-*` per configurar la validació:
   - `data-expected="sortida esperada"` — comparació simple de stdout
   - `data-tests='[{"input":"5","expected":"10"}]'` — múltiples test cases
   - `data-testcode="assert f(2)==4"` — tests unitaris
3. Afegeix l'entrada a `REPTES_DATA` dins `curs/capitols.js`

### Incrustar un simulador a qualsevol pàgina

```html
<div class="simulador"
     data-code='print("Hola!")'
     data-readonly="true"
     data-height="220">
</div>
```

## Arquitectura

Mateixa filosofia que KarelCat:

| Patró | KarelCat | PyCat |
|-------|----------|-------|
| Namespace global | `K` | `P` |
| Motor | Intèrpret JS propi | Pyodide (WebAssembly) |
| Panell dret | Graella visual | Consola de text |
| Validació | Comparació de CSVs | Comparació de stdout / tests |
| Comunicació iframe↔pare | `postMessage` | `postMessage` |
| Execució | Generadors JS (yield) | Web Worker (terminate per aturar) |

## Llicència

(la mateixa que KarelCat)
