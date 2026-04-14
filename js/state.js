// ════════════════════════════════════════════════════════
// state.js — Estat centralitzat de PyCat
//
// Substitueix les globals disperses per un únic objecte.
// Patró idèntic a KarelCat (K.state → P.state).
// ════════════════════════════════════════════════════════

P.state = {
  // Idioma de la interfície
  uiLang:       'ca',

  // Estat de la UI
  currentState: 'idle',   // idle | loading | running | done | error

  // Pyodide
  pyodideReady: false,
  worker:       null,

  // Execució
  running:      false,
  startTime:    null,

  // Exercici (quan s'usa dins d'un iframe del curs)
  goalId:       '',        // identificador del repte
  testCases:    null,      // array de {input, expected}
  testCode:     '',        // codi de test unitari

  // Configuració
  stepDelay:    P.SPEED_DELAYS[1],
};
