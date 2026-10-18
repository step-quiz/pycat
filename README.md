# PyCat

Curs interactiu per aprendre Python real al navegador, en català. Seqüela de [KarelCat](https://karelcat.step-quiz.net).

**→ [pycat.step-quiz.net](https://pycat.step-quiz.net)**

---

## Què és

PyCat és un curs de Python per a alumnes d'ESO que ja han fet KarelCat (o equivalent). Manté la mateixa filosofia: tot al navegador, sense instal·lació, interfície minimalista. La diferència és que executa **CPython real via Pyodide (WebAssembly)**.

El curs té **13 capítols** (els dos últims són extres: el joc del 4 en ratlla i la tortuga gràfica) i **15 reptes** amb validació automàtica. A més:

- **👣 Pas a pas**: executa el programa línia a línia i mostra com canvien les variables.
- **🐢 Tortuga**: `import turtle` dibuixa en un panell (mateixa API que el `turtle` de Python).
- **Activitats**: qüestionaris «què imprimeix?», problemes de Parsons (ordenar el codi) i exercicis «troba l'error».
- Errors de Python explicats en català, codi desat automàticament i diferències línia per línia quan un exercici falla.

| Capítol | Títol |
|---|---|
| 1 | Hola, Python! |
| 2 | Variables |
| 3 | Operacions i input |
| 4 | Decisions: if, elif, else |
| 5 | Repetir amb while (i `try` / `except`) |
| 6 | Repetir amb for i range |
| 7 | Treballant amb text |
| 8 | Llistes |
| 9 | Funcions |
| 10 | Diccionaris |
| 11 | Posant-ho tot junt |
| 12 | 4 en ratlla |
| 13 | Dibuixa amb la tortuga |

## Estructura

```
index.html        Simulador lliure (també és el simulador incrustat als capítols)
style.css         Estils del simulador
family.js         Selector «EXPLORA» dels projectes germans (KarelCat, PyCat, JSCat, HTMLCat)
footer.js         Peu de pàgina comú
sw.js, js/sw-register.js  «Kill switch» que desinstal·la un service worker antic (vegeu TODO.md, tasca 5)
_headers          Capçaleres de Cloudflare Pages
js/               Motor: Pyodide en un Web Worker, editor, consola, validació, pas a pas,
                  tortuga (pycat_turtle.py, pycat_trace.py, pycat_requires.py)
curs/             Capítols, reptes, índex, capitols.js (dades i esquelet), activitats.js,
                  glossari-data.js, curs.css
tests/            Test automàtic del curs i solucions de referència
tools/            Generador de pàgines a partir de JSON (vegeu tools/README.md)
docs/             CURRENT-STATE.md: estat complet del projecte. ARCHITECTURE.md: disseny inicial
                  (desactualitzat)
docs/historic/    Documents històrics: els plans amb què es van escriure els capítols i els
                  reptes (PYCAT-*-PLAN.md) i les notes d'un lliurament antic (CHANGES-PART-A.md)
TODO.md           Feina feta i pendent
```

## Fitxers comuns

`LICENSE`, `LLICENCIA.md`, `family.js`, `footer.js`, `js/kbd-accessory.js`, `curs/progress.js`, `curs/certificat.js` i les icones de la família (`img/htmlcat.svg`, `img/pycat.svg`, `img/karelcat.svg`, `img/jscat.svg`) són **fitxers comuns** dels cursos de la família: l'original és al repositori
[step-quiz-commons](https://github.com/step-quiz/step-quiz-commons), on també hi ha què té de
diferent aquest web (`comuns.json`). El workflow `.github/workflows/comuns.yml` els posa al dia
cada dia (o a mà: Actions → «Fitxers comuns» → Run workflow). **No els editis aquí**: el canvi es
perdria l'endemà. Canvia'ls a step-quiz-commons.

**Certificat.** A l'índex del curs (`curs/index.html`), `curs/certificat.js` mostra quants capítols porta l'alumne i, quan els té tots amb la ✓, el certificat (amb el seu nom i la data) per imprimir o desar en PDF i l'enllaç a JSCat, el curs següent de la sèrie KarelCat → PyCat → JSCat.

## Servir en local

```bash
python3 -m http.server 8000
```

Obre <http://localhost:8000> per al simulador lliure, o <http://localhost:8000/curs/> per al curs.

> Cal un servidor HTTP (no obrir els `.html` com a fitxers): Pyodide i els Web Workers necessiten un origen HTTP.

## Com continuar el desenvolupament

Llegeix [`docs/CURRENT-STATE.md`](docs/CURRENT-STATE.md) abans de fer cap canvi. Conté l'arquitectura, el format de les pàgines i dels simuladors, els contractes entre mòduls, les decisions preses i les tasques pendents.

Després de qualsevol canvi en un exercici, executa el test automàtic (només cal Python 3):

```bash
python3 tests/comprova-curs.py
```

Ara fa 44 exercicis i 99 casos de prova, tots correctes. A GitHub s'executa sol a cada canvi a `main` i a cada pull request (`.github/workflows/tests.yml`), juntament amb `node --check` de tots els fitxers JS. Més detalls a [`tests/README.md`](tests/README.md).

<!-- atribucio-centre:inici -->

---

Material desenvolupat per **David Arso Civil** per al Departament de Matemàtiques de l'INS Miquel Tarradell.
Contingut sota CC BY-NC-SA 4.0, codi sota llicència MIT. Vegeu [`LLICENCIA.md`](LLICENCIA.md).

<!-- atribucio-centre:final -->
