# PyCat — Eines de desenvolupament (`tools/`)

## `generate-pages.js` — Generador de pàgines del curs

Eina per generar HTML de capítols i reptes a partir de descripcions JSON a `tools/pages/*.json`. Permet editar en un sol lloc l'esquelet comú i canviar-lo per totes les pàgines alhora.

L'esquelet és el de les pàgines actuals de PyCat: `<body data-pagina="repte" data-num="6">`, només
el `<main>` (la capçalera i la barra lateral les hi posa `initCursPage()` de `curs/capitols.js`) i
els scripts `glossari-data.js`, `progress.js`, `capitols.js` i `../footer.js`. El mateix fitxer és a
JSCat i GeoCat; només hi canvia el bloc `PROJECTE` del principi (l'esquelet de cada curs).

### Ús

```bash
# Genera totes les pàgines a curs/
node tools/generate-pages.js

# Genera només una (per nom del fitxer de sortida sense extensió)
node tools/generate-pages.js --only repte-6

# Dry run: mostra què generaria sense escriure cap fitxer
node tools/generate-pages.js --dry-run

# Comprova (sense escriure res) que cada JSON produeix la pàgina que hi ha a curs/
# (GitHub ho fa a cada canvi: tests.yml)
node tools/generate-pages.js --comprova

# Canvia els directoris d'entrada/sortida
node tools/generate-pages.js --input tools/pages --out curs
```

### Format del fitxer JSON

Cada pàgina és un `tools/pages/{nom}.json` amb aquesta estructura:

```jsonc
{
  "type":  "capitol" | "repte",       // obligatori
  "num":   6,                          // número del capítol/repte
  "titol": "Parell o senar",           // títol visible
  "difficulty": "facil" | "intermedi" | "dificil",   // només reptes
  "lead":  "<p>Text d'introducció…</p>",              // només capítols (opcional)
  "prev":  { "url": "repte-5.html", "label": "← Repte anterior" },   // opcional (les pàgines
  "next":  { "url": "repte-7.html", "label": "Repte següent →" },     // actuals no en porten)
  "hint":  "<p>Pista HTML opcional…</p>",             // només reptes (opcional)
  "sections": [
    // Forma simple: una secció amb un h2 i body
    { "h2": "Títol", "body": "<p>HTML…</p>" },

    // Forma agrupada: una <section> amb múltiples h2s
    {
      "parts": [
        { "h2": "Objectiu",  "body": "<p>…</p>" },
        { "h2": "Simulador", "body": "<p>…</p>", "simulador": { /* veure sota */ } }
      ]
    }
  ]
}
```

### Atributs del simulador

Dins d'una `part` o `section`, el camp `simulador` genera el `<div class="simulador" data-*>` que `curs/capitols.js` converteix en iframe:

```jsonc
"simulador": {
  "goalId":  "repte-6",                      // per al sistema de progrés
  "code":    "# codi inicial\n",              // codi precarregat a l'editor
  "stdin":   "5\n",                           // per a exercicis amb un sol cas
  "expected": "sortida",                      //    "    "    "
  "tests":    [                               // per a Mode C (múltiples casos)
    { "stdin": "4", "expected": "Parell" },
    { "stdin": "7", "expected": "Senar" }
  ],
  "testcode": "print(funcio(2))\n",           // codi Python afegit després del codi de l'alumne
  "interactive": true,                        // el programa fa input(): es pot provar escrivint
  "requires": "def,return",                   // construccions que la solució ha de fer servir
  "readonly": false,                          // true = no editable (exemples)
  "height":   320
}
```

`stdin`/`expected` i `tests` són mútuament exclusius: fes servir `tests` si hi ha més d'un cas.

### Pàgines d'exemple

- `tools/pages/repte-1.json` — repte fàcil amb `expected` simple.
- `tools/pages/repte-6.json` — repte intermedi amb `tests` múltiples.

### Verificació

Després de generar:

1. `node tools/generate-pages.js --comprova` ha de dir que totes les pàgines coincideixen.
2. `python3 tests/comprova-curs.py` passa les solucions de referència (`tests/solutions.js`)
   contra els casos de prova de tots els simuladors. Si la pàgina és nova, cal afegir-hi la
   solució del seu `goalId`.
3. Serveix el projecte amb `python3 -m http.server` i obre la pàgina al navegador.

### Migrar pàgines existents

L'eina **no migra automàticament** les pàgines actuals. Per passar-ne una a JSON: obre'n l'HTML,
identifica-hi el títol, les seccions (`<h2>` + contingut), el simulador (`<div class="simulador"
data-*>`) i la pista (`<details class="pista">`), i tradueix-ho a l'estructura de dalt. Després,
`--comprova` et dirà si el JSON reprodueix exactament la pàgina (no hi compten els espais ni la
indentació de l'HTML, però sí qualsevol canvi de text, d'atributs o de codi).

## `extreu-pagina.js` — De pàgina a JSON

Fa el camí invers: llegeix un repte de `curs/` i n'escriu el JSON.

```bash
node tools/extreu-pagina.js curs/repte-7.html          # el mostra
node tools/extreu-pagina.js curs/repte-7.html --desa   # el desa a tools/pages/repte-7.json
```

Després, `node tools/generate-pages.js --comprova` diu si el JSON reprodueix exactament la pàgina.
Comprovat amb els 15 reptes publicats el 18/10/2026: tots surten idèntics.
